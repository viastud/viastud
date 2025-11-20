import { BaseSeeder } from '@adonisjs/lucid/seeders'

import Admin from '#models/admin'
import Professor from '#models/professor'
import StudentDetails from '#models/student_details'
import User from '#models/user'

export default class extends BaseSeeder {
  public async run() {
    const eleve = await User.updateOrCreate(
      { email: 'eleve@test.fr' },
      {
        firstName: 'Test',
        lastName: 'Eleve',
        email: 'eleve@test.fr',
        password: 'Eleve123!',
        phoneNumber: '0612345678',
        role: 'STUDENT',
      }
    )

    await StudentDetails.updateOrCreate(
      { userId: eleve.id },
      {
        userId: eleve.id,
      }
    )

    await User.updateOrCreate(
      { email: 'parent@test.fr' },
      {
        firstName: 'Test',
        lastName: 'Parent',
        email: 'parent@test.fr',
        password: 'Parent123!',
        phoneNumber: '0612345678',
        role: 'PARENT',
      }
    )

    await Professor.updateOrCreate(
      { email: 'prof@test.fr' },
      {
        firstName: 'Test',
        lastName: 'Professeur',
        email: 'prof@test.fr',
        password: 'Prof123!',
        phoneNumber: '0612345678',
        subject: 'MATHS',
      }
    )

    await Admin.updateOrCreate(
      { email: 'admin@test.fr' },
      {
        firstName: 'Super',
        lastName: 'Admin',
        email: 'admin@test.fr',
        password: 'Admin123!',
      }
    )

    // Exécuter le seeder de données analytics de test
  }
}
