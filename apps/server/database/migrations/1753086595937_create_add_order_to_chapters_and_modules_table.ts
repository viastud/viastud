import { BaseSchema } from '@adonisjs/lucid/schema'
import { grade, subject } from '@viastud/utils'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('chapters', (table) => {
      table
        .enum('grade', grade, {
          useNative: true,
          enumName: 'grade',
          existingType: true,
        })
        .nullable()

      table
        .enum('subject', subject, {
          useNative: true,
          enumName: 'subject',
          existingType: true,
        })
        .nullable()
    })

    this.schema.alterTable('modules', (table) => {
      table.integer('order_in_chapter').notNullable().defaultTo(0)
      table.unique(['chapter_id', 'order_in_chapter'])
    })
  }

  async down() {
    this.schema.alterTable('chapters', (table) => {
      table.dropColumn('grade')
      table.dropColumn('subject')
    })

    this.schema.alterTable('modules', (table) => {
      table.dropUnique(['chapter_id', 'order_in_chapter'])
      table.dropColumn('order_in_chapter')
    })
  }
}
