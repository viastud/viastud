import { BaseSchema } from '@adonisjs/lucid/schema'
import { faqQuestionCategory } from '@viastud/utils'

export default class extends BaseSchema {
  protected tableName = 'faqs'

  async up() {
    await this.schema.raw('DROP TYPE IF EXISTS faq_question_category CASCADE')
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.text('question')
      table.text('answer')
      table.enum('category', faqQuestionCategory, {
        useNative: true,
        enumName: 'faq_question_category',
      })
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
    this.schema.raw('DROP TYPE IF EXISTS faq_question_category CASCADE')
  }
}
