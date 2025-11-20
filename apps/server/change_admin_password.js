import 'reflect-metadata'
import { Ignitor } from '@adonisjs/core'

/**
 * URL to the application root
 */
const APP_ROOT = new URL('./', import.meta.url)

/**
 * The importer is used to import files in context of the application
 */
const IMPORTER = (filePath) => {
  if (filePath.startsWith('./') || filePath.startsWith('../')) {
    return import(new URL(filePath, APP_ROOT).href)
  }
  return import(filePath)
}

// Get the new password from command line arguments
const newPassword = process.argv[2]
const adminEmail = process.argv[3] || 'admin@test.fr' // Default to seeded admin email

if (!newPassword) {
  console.error('Usage: node change_admin_password.js <new_password> [admin_email]')
  console.error('Example: node change_admin_password.js "MyNewPassword123!" admin@test.fr')
  process.exit(1)
}

// Boot the application
const ignitor = new Ignitor(APP_ROOT, { importer: IMPORTER })

try {
  const app = await ignitor
    .tap((app) => {
      app.booting(async () => {
        await import('./start/env.js')
      })
    })
    .createApp('console')

  await app.boot()

  // Import the Admin model
  const { default: Admin } = await import('./app/models/admin.js')

  // Find the admin by email (case-insensitive)
  const admin = await Admin.query().whereRaw('LOWER(email) = LOWER(?)', [adminEmail]).first()

  if (!admin) {
    console.error(`❌ Admin with email "${adminEmail}" not found`)
    process.exit(1)
  }

  console.log(`🔍 Found admin: ${admin.firstName} ${admin.lastName} (${admin.email})`)

  // Update the password (AdonisJS will automatically hash it)
  admin.password = newPassword
  await admin.save()

  console.log('✅ Admin password updated successfully!')
  console.log('🔒 The password has been automatically hashed and saved to the database.')
} catch (error) {
  console.error('❌ Error changing admin password:', error)
  process.exit(1)
} finally {
  process.exit(0)
}
