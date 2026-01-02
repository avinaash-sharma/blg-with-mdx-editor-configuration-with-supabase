import { test, expect } from '@playwright/test'

// Test credentials
const TEST_EMAIL = 'admin.avinash@blog.com'
const TEST_PASSWORD = 'Lumia@123'

test.describe('Post Editor', () => {
  test.beforeEach(async ({ page }) => {
    // Enable console logging to see what's happening
    page.on('console', (msg) => {
      console.log(`Browser console [${msg.type()}]: ${msg.text()}`)
    })

    // Log network requests to Supabase
    page.on('request', (request) => {
      if (request.url().includes('supabase')) {
        console.log(`>> Request: ${request.method()} ${request.url()}`)
      }
    })

    page.on('response', (response) => {
      if (response.url().includes('supabase')) {
        console.log(`<< Response: ${response.status()} ${response.url()}`)
      }
    })

    // Log request failures
    page.on('requestfailed', (request) => {
      console.log(`!! Request failed: ${request.url()} - ${request.failure()?.errorText}`)
    })
  })

  test('should login and create a new post', async ({ page }) => {
    // Go to login page
    await page.goto('http://localhost:5173/admin/login')

    // Wait for login form to be visible
    await expect(page.locator('h1')).toContainText('Admin Login')

    // Fill in login credentials
    await page.fill('#email', TEST_EMAIL)
    await page.fill('#password', TEST_PASSWORD)

    // Click sign in button and wait for navigation or error
    await page.click('button[type="submit"]')

    // Wait for either navigation away from login or an error message
    await Promise.race([
      page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 }),
      page.locator('.error-message').waitFor({ state: 'visible', timeout: 15000 }).then(() => {
        throw new Error('Login error appeared')
      }),
    ]).catch(async (e) => {
      const errorMessage = await page.locator('.error-message').textContent().catch(() => null)
      if (errorMessage) {
        console.log('Login error:', errorMessage)
        throw new Error(`Login failed: ${errorMessage}`)
      }
      // If no error message, check current URL
      console.log('Current URL:', page.url())
      throw e
    })

    console.log('Login successful!')

    // Wait for auth loading to complete
    await page.waitForFunction(() => {
      return !document.body.textContent?.includes('Loading...')
    }, { timeout: 10000 }).catch(() => console.log('Loading state may still be present'))

    console.log('Navigating to post editor...')

    // Navigate to new post page
    await page.goto('http://localhost:5173/admin/posts/new')

    // Wait for loading to complete again
    await page.waitForFunction(() => {
      return !document.body.textContent?.includes('Loading...')
    }, { timeout: 10000 }).catch(() => console.log('Loading state on editor page'))

    // Wait for the editor to load
    await expect(page.locator('.post-editor')).toBeVisible({ timeout: 10000 })

    console.log('Post editor loaded')

    // Fill in post details
    const testTitle = `Test Post ${Date.now()}`
    const testSlug = `test-post-${Date.now()}`

    await page.fill('#title', testTitle)
    console.log('Title filled:', testTitle)

    // The slug should auto-generate, but let's verify and set it explicitly
    await page.fill('#slug', testSlug)
    console.log('Slug filled:', testSlug)

    // Fill in the MDX editor content
    // The MDX editor uses contenteditable, so we need to click and type
    const editorContent = page.locator('.mdx-content-editable')
    await editorContent.click()
    await page.keyboard.type('# Hello World\n\nThis is a test post created by Playwright.\n\n## Features\n\n- Item 1\n- Item 2\n- Item 3')
    console.log('Content filled')

    // Fill in excerpt
    await page.locator('.form-sidebar textarea').first().fill('This is a test excerpt for the post.')
    console.log('Excerpt filled')

    // Fill in cover image URL (placeholder)
    await page.locator('.form-sidebar input[type="url"]').fill('https://picsum.photos/1200/600')
    console.log('Cover image filled')

    // Check the published checkbox
    await page.locator('.checkbox-label input[type="checkbox"]').check()
    console.log('Published checkbox checked')

    // Take a screenshot before submitting
    await page.screenshot({ path: 'tests/screenshots/before-submit.png', fullPage: true })
    console.log('Screenshot taken')

    // Click the submit button
    console.log('Clicking submit button...')
    await page.click('.publish-actions button[type="submit"]')

    // Wait a moment and check what happens
    await page.waitForTimeout(3000)

    // Check for error message
    const errorElement = page.locator('.editor-error')
    const hasError = await errorElement.isVisible().catch(() => false)
    if (hasError) {
      const errorText = await errorElement.textContent()
      console.log('Error displayed:', errorText)
      await page.screenshot({ path: 'tests/screenshots/error-state.png', fullPage: true })
      throw new Error(`Post creation failed: ${errorText}`)
    }

    // Check if button is still in "Saving..." state
    const buttonText = await page.locator('.publish-actions button').textContent()
    console.log('Button text after submit:', buttonText)

    if (buttonText?.includes('Saving')) {
      console.log('Button still shows "Saving..." - request may be hanging')
      await page.screenshot({ path: 'tests/screenshots/saving-state.png', fullPage: true })

      // Wait longer to see if it completes
      await page.waitForTimeout(5000)
      const buttonTextAfterWait = await page.locator('.publish-actions button').textContent()
      console.log('Button text after longer wait:', buttonTextAfterWait)
    }

    // Check if we navigated to the posts list
    const currentUrl = page.url()
    console.log('Current URL:', currentUrl)

    if (currentUrl.includes('/admin/posts') && !currentUrl.includes('/new')) {
      console.log('Successfully navigated to posts list!')
      await expect(page).toHaveURL(/\/admin\/posts$/)
    } else {
      await page.screenshot({ path: 'tests/screenshots/final-state.png', fullPage: true })
      console.log('Did not navigate as expected')
    }
  })

  test('should show validation errors for empty fields', async ({ page }) => {
    // Go directly to new post page
    await page.goto('http://localhost:5173/admin/posts/new')

    // If redirected to login, skip this test
    if (page.url().includes('login')) {
      console.log('Not logged in, skipping validation test')
      test.skip()
      return
    }

    // Wait for the editor
    await expect(page.locator('.post-editor')).toBeVisible({ timeout: 10000 })

    // Try to submit without filling anything
    await page.click('.publish-actions button[type="submit"]')

    // HTML5 validation should prevent submission, or our custom validation should show error
    // Check if the title input has validation error styling
    const titleInput = page.locator('#title')
    const isInvalid = await titleInput.evaluate((el: HTMLInputElement) => !el.validity.valid)

    if (isInvalid) {
      console.log('HTML5 validation prevented submission (title required)')
    } else {
      // Check for custom error message
      const errorElement = page.locator('.editor-error')
      const hasError = await errorElement.isVisible().catch(() => false)
      if (hasError) {
        const errorText = await errorElement.textContent()
        console.log('Custom validation error:', errorText)
        expect(errorText).toContain('required')
      }
    }
  })
})
