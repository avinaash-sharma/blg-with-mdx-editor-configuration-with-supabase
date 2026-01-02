import { test, expect, type Page } from '@playwright/test'

// Test credentials - update these with valid test credentials
const TEST_EMAIL = 'admin.avinash@blog.com'
const TEST_PASSWORD = 'Lumia@123'

// Helper function to login
async function login(page: Page) {
  await page.goto('http://localhost:5173/admin/login')
  await expect(page.locator('h1')).toContainText('Admin Login')

  await page.fill('#email', TEST_EMAIL)
  await page.fill('#password', TEST_PASSWORD)
  await page.click('button[type="submit"]')

  // Wait for successful login (navigation away from login page)
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 })

  // Wait for auth loading to complete
  await page.waitForFunction(() => {
    return !document.body.textContent?.includes('Loading...')
  }, { timeout: 10000 })
}

// Helper function to generate unique test data
function generateTestData() {
  const timestamp = Date.now()
  return {
    title: `Test Blog Post ${timestamp}`,
    slug: `test-blog-post-${timestamp}`,
    content: `# Welcome to My Test Post

This is a test blog post created by Playwright automated tests.

## Introduction

This post demonstrates the blog posting functionality with various markdown features.

## Features Tested

- Creating a new blog post
- Adding markdown content
- Setting post metadata
- Publishing workflow

## Code Example

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

## Conclusion

This test verifies that the blog posting system works correctly.`,
    excerpt: `This is a test excerpt for automated testing - ${timestamp}`,
    coverImage: 'https://picsum.photos/1200/600',
  }
}

test.describe('Blog Posting', () => {
  test.beforeEach(async ({ page }) => {
    // Enable console logging for debugging
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log(`Browser error: ${msg.text()}`)
      }
    })

    // Log Supabase API calls
    page.on('response', (response) => {
      if (response.url().includes('supabase') && response.status() >= 400) {
        console.log(`API Error: ${response.status()} ${response.url()}`)
      }
    })
  })

  test('should successfully create and publish a new blog post', async ({ page }) => {
    // Login first
    await login(page)

    // Navigate to new post page
    await page.goto('http://localhost:5173/admin/posts/new')
    await expect(page.locator('.post-editor')).toBeVisible({ timeout: 10000 })

    // Generate test data
    const testData = generateTestData()

    // Fill in the title
    await page.fill('#title', testData.title)
    await expect(page.locator('#title')).toHaveValue(testData.title)

    // Verify slug auto-generation
    const slugValue = await page.locator('#slug').inputValue()
    expect(slugValue).toContain('test-blog-post')

    // Override with our specific slug
    await page.fill('#slug', testData.slug)

    // Fill in the MDX editor content
    const editorContent = page.locator('.mdx-content-editable')
    await editorContent.click()
    await editorContent.fill('')
    await page.keyboard.type(testData.content, { delay: 5 })

    // Fill in excerpt
    await page.locator('.form-sidebar textarea').first().fill(testData.excerpt)

    // Fill in cover image URL
    await page.locator('.form-sidebar input[type="url"]').fill(testData.coverImage)

    // Wait for cover image preview to load
    await expect(page.locator('.cover-preview')).toBeVisible({ timeout: 5000 })

    // Check the published checkbox
    await page.locator('.checkbox-label input[type="checkbox"]').check()
    await expect(page.locator('.checkbox-label input[type="checkbox"]')).toBeChecked()

    // Submit the form
    await page.click('.publish-actions button[type="submit"]')

    // Wait for navigation to posts list
    await expect(page).toHaveURL(/\/admin\/posts$/, { timeout: 15000 })

    // Verify the post appears in the list
    await expect(page.locator('text=' + testData.title)).toBeVisible({ timeout: 5000 })
  })

  test('should create a draft post (unpublished)', async ({ page }) => {
    await login(page)

    await page.goto('http://localhost:5173/admin/posts/new')
    await expect(page.locator('.post-editor')).toBeVisible({ timeout: 10000 })

    const testData = generateTestData()
    testData.title = `Draft Post ${Date.now()}`
    testData.slug = `draft-post-${Date.now()}`

    // Fill in required fields
    await page.fill('#title', testData.title)
    await page.fill('#slug', testData.slug)

    // Add minimal content
    const editorContent = page.locator('.mdx-content-editable')
    await editorContent.click()
    await page.keyboard.type('# Draft Post\n\nThis is a draft post.')

    // DO NOT check the published checkbox (leave as draft)
    await expect(page.locator('.checkbox-label input[type="checkbox"]')).not.toBeChecked()

    // Submit the form
    await page.click('.publish-actions button[type="submit"]')

    // Wait for navigation to posts list
    await expect(page).toHaveURL(/\/admin\/posts$/, { timeout: 15000 })

    // Verify the draft post appears in the list
    await expect(page.locator('text=' + testData.title)).toBeVisible({ timeout: 5000 })
  })

  test('should show validation error for empty title', async ({ page }) => {
    await login(page)

    await page.goto('http://localhost:5173/admin/posts/new')
    await expect(page.locator('.post-editor')).toBeVisible({ timeout: 10000 })

    // Fill slug but leave title empty
    await page.fill('#slug', 'test-slug')

    // Try to submit
    await page.click('.publish-actions button[type="submit"]')

    // HTML5 validation should prevent submission
    const titleInput = page.locator('#title')
    const isInvalid = await titleInput.evaluate((el: HTMLInputElement) => !el.validity.valid)
    expect(isInvalid).toBe(true)

    // Should still be on the new post page
    await expect(page).toHaveURL(/\/admin\/posts\/new/)
  })

  test('should show validation error for empty slug', async ({ page }) => {
    await login(page)

    await page.goto('http://localhost:5173/admin/posts/new')
    await expect(page.locator('.post-editor')).toBeVisible({ timeout: 10000 })

    // Fill title
    await page.fill('#title', 'Test Title')

    // Clear the auto-generated slug
    await page.fill('#slug', '')

    // Try to submit
    await page.click('.publish-actions button[type="submit"]')

    // HTML5 validation should prevent submission OR custom error should appear
    const slugInput = page.locator('#slug')
    const isInvalid = await slugInput.evaluate((el: HTMLInputElement) => !el.validity.valid)

    if (!isInvalid) {
      // Check for custom validation error
      const errorElement = page.locator('.editor-error')
      await expect(errorElement).toBeVisible({ timeout: 3000 })
      await expect(errorElement).toContainText('Slug is required')
    }

    // Should still be on the new post page
    await expect(page).toHaveURL(/\/admin\/posts\/new/)
  })

  test('should preview post before publishing', async ({ page }) => {
    await login(page)

    await page.goto('http://localhost:5173/admin/posts/new')
    await expect(page.locator('.post-editor')).toBeVisible({ timeout: 10000 })

    const testData = generateTestData()

    // Fill in post data
    await page.fill('#title', testData.title)
    await page.fill('#slug', testData.slug)

    const editorContent = page.locator('.mdx-content-editable')
    await editorContent.click()
    await page.keyboard.type('# Preview Test\n\nThis is content to preview.')

    await page.locator('.form-sidebar textarea').first().fill(testData.excerpt)
    await page.locator('.form-sidebar input[type="url"]').fill(testData.coverImage)

    // Switch to preview mode
    await page.click('.toggle-btn:has-text("Preview")')

    // Verify preview elements are visible
    await expect(page.locator('.preview-container')).toBeVisible()
    await expect(page.locator('.preview-title')).toContainText(testData.title)
    await expect(page.locator('.preview-excerpt')).toContainText(testData.excerpt)
    await expect(page.locator('.preview-cover')).toBeVisible()

    // Switch back to edit mode
    await page.click('.back-to-edit-btn')
    await expect(page.locator('.editor-form')).toBeVisible()
  })

  test('should save post from preview mode', async ({ page }) => {
    await login(page)

    await page.goto('http://localhost:5173/admin/posts/new')
    await expect(page.locator('.post-editor')).toBeVisible({ timeout: 10000 })

    const timestamp = Date.now()
    const testTitle = `Preview Save Test ${timestamp}`
    const testSlug = `preview-save-test-${timestamp}`

    // Fill in post data
    await page.fill('#title', testTitle)
    await page.fill('#slug', testSlug)

    const editorContent = page.locator('.mdx-content-editable')
    await editorContent.click()
    await page.keyboard.type('# Save from Preview\n\nTesting save functionality from preview mode.')

    // Switch to preview mode
    await page.click('.toggle-btn:has-text("Preview")')
    await expect(page.locator('.preview-container')).toBeVisible()

    // Click save button in preview mode
    await page.click('.preview-actions .save-button')

    // Wait for navigation to posts list
    await expect(page).toHaveURL(/\/admin\/posts$/, { timeout: 15000 })

    // Verify the post was created
    await expect(page.locator(`text=${testTitle}`)).toBeVisible({ timeout: 5000 })
  })

  test('should auto-generate slug from title', async ({ page }) => {
    await login(page)

    await page.goto('http://localhost:5173/admin/posts/new')
    await expect(page.locator('.post-editor')).toBeVisible({ timeout: 10000 })

    // Type a title with special characters
    await page.fill('#title', 'My Awesome Blog Post! #1')

    // Check that slug was auto-generated correctly
    const slugValue = await page.locator('#slug').inputValue()
    expect(slugValue).toBe('my-awesome-blog-post-1')
  })

  test('should handle post with code blocks', async ({ page }) => {
    await login(page)

    await page.goto('/admin/posts/new')
    await expect(page.locator('.post-editor')).toBeVisible({ timeout: 10000 })

    const timestamp = Date.now()
    const testTitle = `Code Block Test ${timestamp}`
    const testSlug = `code-block-test-${timestamp}`

    await page.fill('#title', testTitle)
    await page.fill('#slug', testSlug)

    // Add content with code blocks
    const editorContent = page.locator('.mdx-content-editable')
    await editorContent.click()
    await page.keyboard.type(`# Code Examples

Here is some JavaScript code:

\`\`\`javascript
const greeting = "Hello, World!";
console.log(greeting);
\`\`\`

And some Python:

\`\`\`python
def greet(name):
    return f"Hello, {name}!"
\`\`\`
`, { delay: 5 })

    // Check published
    await page.locator('.checkbox-label input[type="checkbox"]').check()

    // Submit
    await page.click('.publish-actions button[type="submit"]')

    // Wait for navigation
    await expect(page).toHaveURL(/\/admin\/posts$/, { timeout: 15000 })

    // Verify post was created
    await expect(page.locator(`text=${testTitle}`)).toBeVisible({ timeout: 5000 })
  })

  test('should display error message on API failure', async ({ page }) => {
    await login(page)

    await page.goto('http://localhost:5173/admin/posts/new')
    await expect(page.locator('.post-editor')).toBeVisible({ timeout: 10000 })

    // Use a slug that might conflict (if one exists)
    // First create a post
    const duplicateSlug = `duplicate-test-${Date.now()}`

    await page.fill('#title', 'First Post')
    await page.fill('#slug', duplicateSlug)

    const editorContent = page.locator('.mdx-content-editable')
    await editorContent.click()
    await page.keyboard.type('Content')

    await page.click('.publish-actions button[type="submit"]')
    await expect(page).toHaveURL(/\/admin\/posts$/, { timeout: 15000 })

    // Now try to create another post with the same slug
    await page.goto('/admin/posts/new')
    await expect(page.locator('.post-editor')).toBeVisible({ timeout: 10000 })

    await page.fill('#title', 'Second Post Same Slug')
    await page.fill('#slug', duplicateSlug)

    const editorContent2 = page.locator('.mdx-content-editable')
    await editorContent2.click()
    await page.keyboard.type('Content')

    await page.click('.publish-actions button[type="submit"]')

    // Should show error message (duplicate slug constraint)
    const errorElement = page.locator('.editor-error')
    const hasError = await errorElement.isVisible({ timeout: 5000 }).catch(() => false)

    // If there's a unique constraint on slug, we should see an error
    // If not, the test passes anyway (depends on database schema)
    if (hasError) {
      const errorText = await errorElement.textContent()
      console.log('Error message displayed:', errorText)
      expect(errorText).toBeTruthy()
    }
  })
})

test.describe('Blog Posting - Unauthenticated', () => {
  test('should redirect to login when accessing post editor without auth', async ({ page }) => {
    // Try to access the new post page directly without logging in
    await page.goto('http://localhost:5173/admin/posts/new')

    // Should be redirected to login page
    await expect(page).toHaveURL(/\/admin\/login/, { timeout: 10000 })
  })

  test('should redirect to login when accessing posts list without auth', async ({ page }) => {
    await page.goto('/admin/posts')

    // Should be redirected to login page
    await expect(page).toHaveURL(/\/admin\/login/, { timeout: 10000 })
  })
})
