import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected professorAvailabilitiesTable = 'professor_availabilities'
  protected slotsTable = 'slots'

  public async up() {
    // Drop existing CHECK constraints on `hour` that cap at 20, then add new ones capped at 21
    const dropHourChecks = async (table: string) => {
      const res = (await this.db.rawQuery(
        `
        SELECT conname, pg_get_constraintdef(pc.oid) AS def
        FROM pg_constraint pc
        JOIN pg_class c ON c.oid = pc.conrelid
        WHERE c.relname = ? AND pc.contype = 'c'
      `,
        [table]
      )) as unknown as { rows: { conname: string; def: string }[] }

      const candidates = (res.rows ?? []).filter((row) => {
        const def = row.def.toLowerCase()
        // Constraint targets the `hour` column and includes an upper bound at 20
        return (
          def.includes('hour') &&
          (def.includes('<= 20') || def.includes('between 7 and 20') || def.includes('< 21'))
        )
      })

      for (const cand of candidates) {
        await this.schema.raw(
          `ALTER TABLE ${table} DROP CONSTRAINT IF EXISTS ${JSON.stringify(cand.conname).replace(
            /"/g,
            ''
          )}`
        )
      }

      // Also drop well-known potential names before adding our deterministic one
      const defaultName = `${table}_hour_check`
      const customName = `${table}_hour_check_viastud`
      await this.schema.raw(`ALTER TABLE ${table} DROP CONSTRAINT IF EXISTS ${defaultName}`)
      await this.schema.raw(`ALTER TABLE ${table} DROP CONSTRAINT IF EXISTS ${customName}`)

      // Add a deterministic CHECK constraint name for future-proofing
      await this.schema.raw(
        `ALTER TABLE ${table} ADD CONSTRAINT ${customName} CHECK ("hour" BETWEEN 7 AND 21)`
      )
    }

    await dropHourChecks(this.professorAvailabilitiesTable)
    await dropHourChecks(this.slotsTable)
  }

  public async down() {
    const revertHourChecks = async (table: string) => {
      const defaultName = `${table}_hour_check`
      const customName = `${table}_hour_check_viastud`
      // Drop both if present
      await this.schema.raw(`ALTER TABLE ${table} DROP CONSTRAINT IF EXISTS ${customName}`)
      await this.schema.raw(`ALTER TABLE ${table} DROP CONSTRAINT IF EXISTS ${defaultName}`)

      // Re-add the previous cap at 20 with the default name
      await this.schema.raw(
        `ALTER TABLE ${table} ADD CONSTRAINT ${defaultName} CHECK ("hour" BETWEEN 7 AND 20)`
      )
    }

    await revertHourChecks(this.professorAvailabilitiesTable)
    await revertHourChecks(this.slotsTable)
  }
}
