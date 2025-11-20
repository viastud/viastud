import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('quiz_questions', (table) => {
      table.text('detailed_answer').alter()
      table.text('title').alter()
    })
    this.schema.alterTable('quiz_question_answers', (table) => {
      table.text('content').alter()
    })
  }

  async down() {}
}
