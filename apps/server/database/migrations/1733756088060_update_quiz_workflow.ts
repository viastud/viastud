import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected quizQuestionsTable = 'quiz_questions'
  protected quizQuestionAnswersTable = 'quiz_question_answers'
  protected quizzesTable = 'quizzes'

  async up() {
    this.schema.createTable(this.quizQuestionsTable, (table) => {
      table.increments('id')
      table
        .integer('module_id')
        .unsigned()
        .references('modules.id')
        .onDelete('CASCADE')
        .notNullable()
      table.string('titled').notNullable()
      table.string('detailed_answer').notNullable()
      table.boolean('is_multiple_choice').defaultTo('false').notNullable()
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())
    })

    this.schema.createTable(this.quizQuestionAnswersTable, (table) => {
      table.increments('id')
      table
        .integer('question_id')
        .unsigned()
        .references('quiz_questions.id')
        .onDelete('CASCADE')
        .notNullable()
      table.string('content').notNullable()
      table.boolean('is_right_answer').notNullable()
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())
    })

    this.schema.dropTable(this.quizzesTable)
  }

  async down() {
    this.schema.dropTable(this.quizQuestionAnswersTable)
    this.schema.dropTable(this.quizQuestionsTable)
    this.schema.createTable(this.quizzesTable, (table) => {
      table.increments('id')
      table.string('name').notNullable()
      table
        .integer('module_id')
        .unsigned()
        .references('modules.id')
        .onDelete('CASCADE')
        .notNullable()

      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())
    })
  }
}
