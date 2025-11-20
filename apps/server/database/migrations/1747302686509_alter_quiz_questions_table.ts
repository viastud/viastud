import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'quiz_questions'
  protected quizQuestionImagesTable = 'quiz_question_images'
  protected exerciceImagesTable = 'exercice_images'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.renameColumn('titled', 'title')
      table.uuid('file_id').references('files.id').unique().onDelete('CASCADE')
    })

    this.schema.alterTable(this.exerciceImagesTable, (table) => {
      table.dropForeign(['exercice_id'])
      table.integer('exercice_id').alter().references('exercices.id').onDelete('CASCADE')
    })

    this.schema.createTable(this.quizQuestionImagesTable, (table) => {
      table.integer('quiz_question_id').references('quiz_questions.id').onDelete('CASCADE')
      table.uuid('file_id').references('files.id').unique().onDelete('CASCADE')

      table.unique(['quiz_question_id', 'file_id'])
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.renameColumn('title', 'titled')
      table.dropColumn('file_id')
    })

    this.schema.dropTable(this.quizQuestionImagesTable)
  }
}
