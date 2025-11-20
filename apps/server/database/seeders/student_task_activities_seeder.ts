import { BaseSeeder } from '@adonisjs/lucid/seeders'

import Chapter from '#models/chapter'
import Exercice from '#models/exercice'
import Module from '#models/module'
import QuizQuestion from '#models/quiz_question'
import QuizQuestionAnswer from '#models/quiz_question_answer'
import StudentTaskActivity from '#models/student_task_activity'
import User from '#models/user'

export default class extends BaseSeeder {
  public async run() {
    // Vérifier que l'utilisateur enfant existe
    const childUser = await User.find('c5f19f2c-6d98-4f64-95e0-0e50f14aac91')

    if (!childUser) {
      return
    }

    // Créer des chapitres de test
    const chapters = [
      {
        name: 'Fonctions et équations',
      },
      {
        name: "Géométrie dans l'espace",
      },
      {
        name: 'Probabilités et statistiques',
      },
      {
        name: 'Mécanique',
      },
      {
        name: 'Chimie organique',
      },
    ]

    const createdChapters = []
    for (const chapterData of chapters) {
      const chapter = await Chapter.updateOrCreate({ name: chapterData.name }, chapterData)
      createdChapters.push(chapter)
    }

    // Créer des modules de test
    const modulesData = [
      {
        name: 'Fonctions du second degré',
        grade: 'SECONDE' as const,
        subject: 'MATHS' as const,
        chapterId: createdChapters[0].id,
      },
      {
        name: 'Équations et inéquations',
        grade: 'SECONDE' as const,
        subject: 'MATHS' as const,
        chapterId: createdChapters[0].id,
      },
      {
        name: 'Vecteurs et translations',
        grade: 'SECONDE' as const,
        subject: 'MATHS' as const,
        chapterId: createdChapters[1].id,
      },
      {
        name: 'Probabilités conditionnelles',
        grade: 'PREMIERE' as const,
        subject: 'MATHS' as const,
        chapterId: createdChapters[2].id,
      },
      // Physique-Chimie modules removed
    ]

    const createdModules = []
    for (const moduleData of modulesData) {
      const module = await Module.updateOrCreate(
        {
          name: moduleData.name,
          grade: moduleData.grade,
          subject: moduleData.subject,
          chapterId: moduleData.chapterId,
        },
        moduleData
      )
      createdModules.push(module)
    }

    // Créer des exercices de test
    const exercicesData = [
      {
        name: "Résolution d'équations du second degré",
        moduleId: createdModules[0].id,
        content:
          "Résoudre l'équation x² - 5x + 6 = 0. Déterminer les racines et factoriser le polynôme.",
      },
      {
        name: 'Étude de fonctions quadratiques',
        moduleId: createdModules[0].id,
        content:
          'Étudier la fonction f(x) = x² - 4x + 3. Déterminer son tableau de variations et ses extremums.',
      },
      {
        name: 'Inéquations du second degré',
        moduleId: createdModules[1].id,
        content: "Résoudre l'inéquation x² - 3x - 4 > 0. Représenter la solution sur un axe.",
      },
      {
        name: "Système d'équations linéaires",
        moduleId: createdModules[1].id,
        content: 'Résoudre le système : {2x + y = 5, x - 3y = -1}',
      },
      {
        name: 'Calcul vectoriel - Norme et produit scalaire',
        moduleId: createdModules[2].id,
        content: 'Calculer la norme du vecteur u = (3, 4) et le produit scalaire avec v = (1, 2)',
      },
      {
        name: 'Translations et vecteurs',
        moduleId: createdModules[2].id,
        content: "Déterminer l'image du point A(2, 3) par la translation de vecteur u = (-1, 2)",
      },
      {
        name: 'Probabilités conditionnelles',
        moduleId: createdModules[3].id,
        content: 'Calculer P(A|B) sachant que P(A) = 0.3, P(B) = 0.5 et P(A∩B) = 0.1',
      },
      {
        name: 'Loi binomiale',
        moduleId: createdModules[3].id,
        content: 'Calculer P(X = 3) pour une variable X suivant B(10, 0.4)',
      },
      {
        name: 'Mouvement rectiligne uniforme',
        moduleId: createdModules[4].id,
        content:
          'Un mobile se déplace à vitesse constante v = 5 m/s. Calculer sa position après 10 secondes.',
      },
      {
        name: 'Réactions acido-basiques',
        moduleId: createdModules[5].id,
        content:
          "Écrire l'équation de la réaction entre HCl et NaOH. Calculer le pH de la solution finale.",
      },
    ]

    const createdExercices = []
    for (const exerciceData of exercicesData) {
      const exercice = await Exercice.updateOrCreate(
        {
          name: exerciceData.name,
          moduleId: exerciceData.moduleId,
        },
        exerciceData
      )
      createdExercices.push(exercice)
    }

    // Créer des questions de quiz de test
    const quizQuestionsData = [
      {
        moduleId: createdModules[0].id,
        title: 'Quelle est la forme canonique de f(x) = x² - 4x + 3 ?',
        detailedAnswer: 'La forme canonique est f(x) = (x - 2)² - 1',
        isMultipleChoice: true,
      },
      {
        moduleId: createdModules[0].id,
        title: "Combien de racines a l'équation x² - 5x + 6 = 0 ?",
        detailedAnswer: "L'équation a 2 racines : x = 2 et x = 3",
        isMultipleChoice: true,
      },
      {
        moduleId: createdModules[1].id,
        title: "Résoudre l'inéquation x² - 3x - 4 > 0",
        detailedAnswer: 'La solution est x < -1 ou x > 4',
        isMultipleChoice: true,
      },
      {
        moduleId: createdModules[1].id,
        title: 'Résoudre le système : {2x + y = 5, x - 3y = -1}',
        detailedAnswer: 'La solution est x = 2 et y = 1',
        isMultipleChoice: true,
      },
      {
        moduleId: createdModules[2].id,
        title: 'Calculer la norme du vecteur u = (3, 4)',
        detailedAnswer: 'La norme est ||u|| = √(3² + 4²) = 5',
        isMultipleChoice: true,
      },
      {
        moduleId: createdModules[2].id,
        title: "Quelle est l'image du point A(2, 3) par la translation de vecteur u = (-1, 2) ?",
        detailedAnswer: "L'image est le point A'(1, 5)",
        isMultipleChoice: true,
      },
      {
        moduleId: createdModules[3].id,
        title: 'Calculer P(A|B) sachant que P(A) = 0.3, P(B) = 0.5 et P(A∩B) = 0.1',
        detailedAnswer: 'P(A|B) = P(A∩B)/P(B) = 0.1/0.5 = 0.2',
        isMultipleChoice: true,
      },
      {
        moduleId: createdModules[3].id,
        title: 'Calculer P(X = 3) pour une variable X suivant B(10, 0.4)',
        detailedAnswer: 'P(X = 3) = C(10,3) × 0.4³ × 0.6⁷ ≈ 0.215',
        isMultipleChoice: true,
      },
      {
        moduleId: createdModules[4].id,
        title:
          'Un mobile se déplace à vitesse constante v = 5 m/s. Quelle est sa position après 10 secondes ?',
        detailedAnswer: 'La position est x = v × t = 5 × 10 = 50 m',
        isMultipleChoice: true,
      },
      {
        moduleId: createdModules[5].id,
        title: "Écrire l'équation de la réaction entre HCl et NaOH",
        detailedAnswer: 'HCl + NaOH → NaCl + H₂O',
        isMultipleChoice: true,
      },
    ]

    const createdQuizQuestions = []
    for (const questionData of quizQuestionsData) {
      const question = await QuizQuestion.updateOrCreate(
        {
          title: questionData.title,
          moduleId: questionData.moduleId,
        },
        questionData
      )
      createdQuizQuestions.push(question)
    }

    // Créer des réponses pour chaque question
    const quizAnswersData = [
      // Réponses pour la question 1 (formes canoniques)
      {
        questionId: createdQuizQuestions[0].id,
        content: '(x - 2)² - 1',
        isRightAnswer: true,
      },
      {
        questionId: createdQuizQuestions[0].id,
        content: '(x + 2)² - 1',
        isRightAnswer: false,
      },
      {
        questionId: createdQuizQuestions[0].id,
        content: '(x - 2)² + 1',
        isRightAnswer: false,
      },
      {
        questionId: createdQuizQuestions[0].id,
        content: '(x + 2)² + 1',
        isRightAnswer: false,
      },
      // Réponses pour la question 2 (racines)
      {
        questionId: createdQuizQuestions[1].id,
        content: '2 racines',
        isRightAnswer: true,
      },
      {
        questionId: createdQuizQuestions[1].id,
        content: '1 racine',
        isRightAnswer: false,
      },
      {
        questionId: createdQuizQuestions[1].id,
        content: 'Aucune racine',
        isRightAnswer: false,
      },
      {
        questionId: createdQuizQuestions[1].id,
        content: '3 racines',
        isRightAnswer: false,
      },
      // Réponses pour la question 3 (inéquations)
      {
        questionId: createdQuizQuestions[2].id,
        content: 'x < -1 ou x > 4',
        isRightAnswer: true,
      },
      {
        questionId: createdQuizQuestions[2].id,
        content: 'x > -1 et x < 4',
        isRightAnswer: false,
      },
      {
        questionId: createdQuizQuestions[2].id,
        content: 'x < 4',
        isRightAnswer: false,
      },
      {
        questionId: createdQuizQuestions[2].id,
        content: 'x > -1',
        isRightAnswer: false,
      },
      // Réponses pour la question 4 (système d'équations)
      {
        questionId: createdQuizQuestions[3].id,
        content: 'x = 2 et y = 1',
        isRightAnswer: true,
      },
      {
        questionId: createdQuizQuestions[3].id,
        content: 'x = 1 et y = 2',
        isRightAnswer: false,
      },
      {
        questionId: createdQuizQuestions[3].id,
        content: 'x = 3 et y = 0',
        isRightAnswer: false,
      },
      {
        questionId: createdQuizQuestions[3].id,
        content: 'x = 0 et y = 3',
        isRightAnswer: false,
      },
      // Réponses pour la question 5 (norme vectorielle)
      {
        questionId: createdQuizQuestions[4].id,
        content: '5',
        isRightAnswer: true,
      },
      {
        questionId: createdQuizQuestions[4].id,
        content: '7',
        isRightAnswer: false,
      },
      {
        questionId: createdQuizQuestions[4].id,
        content: '3',
        isRightAnswer: false,
      },
      {
        questionId: createdQuizQuestions[4].id,
        content: '4',
        isRightAnswer: false,
      },
      // Réponses pour la question 6 (translation)
      {
        questionId: createdQuizQuestions[5].id,
        content: "A'(1, 5)",
        isRightAnswer: true,
      },
      {
        questionId: createdQuizQuestions[5].id,
        content: "A'(3, 1)",
        isRightAnswer: false,
      },
      {
        questionId: createdQuizQuestions[5].id,
        content: "A'(1, 1)",
        isRightAnswer: false,
      },
      {
        questionId: createdQuizQuestions[5].id,
        content: "A'(3, 5)",
        isRightAnswer: false,
      },
      // Réponses pour la question 7 (probabilités conditionnelles)
      {
        questionId: createdQuizQuestions[6].id,
        content: '0.2',
        isRightAnswer: true,
      },
      {
        questionId: createdQuizQuestions[6].id,
        content: '0.6',
        isRightAnswer: false,
      },
      {
        questionId: createdQuizQuestions[6].id,
        content: '0.1',
        isRightAnswer: false,
      },
      {
        questionId: createdQuizQuestions[6].id,
        content: '0.3',
        isRightAnswer: false,
      },
      // Réponses pour la question 8 (loi binomiale)
      {
        questionId: createdQuizQuestions[7].id,
        content: '0.215',
        isRightAnswer: true,
      },
      {
        questionId: createdQuizQuestions[7].id,
        content: '0.4',
        isRightAnswer: false,
      },
      {
        questionId: createdQuizQuestions[7].id,
        content: '0.6',
        isRightAnswer: false,
      },
      {
        questionId: createdQuizQuestions[7].id,
        content: '0.1',
        isRightAnswer: false,
      },
      // Réponses pour la question 9 (mécanique)
      {
        questionId: createdQuizQuestions[8].id,
        content: '50 m',
        isRightAnswer: true,
      },
      {
        questionId: createdQuizQuestions[8].id,
        content: '5 m',
        isRightAnswer: false,
      },
      {
        questionId: createdQuizQuestions[8].id,
        content: '15 m',
        isRightAnswer: false,
      },
      {
        questionId: createdQuizQuestions[8].id,
        content: '100 m',
        isRightAnswer: false,
      },
      // Réponses pour la question 10 (chimie)
      {
        questionId: createdQuizQuestions[9].id,
        content: 'HCl + NaOH → NaCl + H₂O',
        isRightAnswer: true,
      },
      {
        questionId: createdQuizQuestions[9].id,
        content: 'HCl + NaOH → NaCl + H₂',
        isRightAnswer: false,
      },
      {
        questionId: createdQuizQuestions[9].id,
        content: 'HCl + NaOH → Na + Cl + H₂O',
        isRightAnswer: false,
      },
      {
        questionId: createdQuizQuestions[9].id,
        content: 'HCl + NaOH → NaCl + O₂',
        isRightAnswer: false,
      },
    ]

    const createdQuizAnswers = []
    for (const answerData of quizAnswersData) {
      const answer = await QuizQuestionAnswer.updateOrCreate(
        {
          questionId: answerData.questionId,
          content: answerData.content,
        },
        answerData
      )
      createdQuizAnswers.push(answer)
    }

    // Données de test pour les activités de tâches
    const taskActivities = [
      // Quiz sur les fonctions - Première tentative réussie
      {
        studentId: childUser.id,
        moduleId: createdModules[0].id,
        taskType: 'quiz' as const,
        taskId: createdQuizQuestions[0].id,
        attemptNumber: 1,
        timeSpent: 300, // 5 minutes
        status: 'succeeded' as const,
        score: 85.5,
        metadata: {
          questionsAnswered: 10,
          totalQuestions: 10,
          correctAnswers: 8,
          incorrectAnswers: 2,
        },
      },
      // Quiz sur les fonctions - Deuxième tentative (amélioration)
      {
        studentId: childUser.id,
        moduleId: createdModules[0].id,
        taskType: 'quiz' as const,
        taskId: createdQuizQuestions[0].id,
        attemptNumber: 2,
        timeSpent: 450, // 7.5 minutes
        status: 'succeeded' as const,
        score: 92.0,
        metadata: {
          questionsAnswered: 10,
          totalQuestions: 10,
          correctAnswers: 9,
          incorrectAnswers: 1,
        },
      },
      // Exercice équations du second degré - Réussi
      {
        studentId: childUser.id,
        moduleId: createdModules[0].id,
        taskType: 'exercise' as const,
        taskId: createdExercices[0].id,
        attemptNumber: 1,
        timeSpent: 600, // 10 minutes
        status: 'succeeded' as const,
        score: 100.0,
        metadata: {
          stepsCompleted: 5,
          totalSteps: 5,
          hintsUsed: 0,
        },
      },
      // Exercice fonctions quadratiques - Échoué
      {
        studentId: childUser.id,
        moduleId: createdModules[0].id,
        taskType: 'exercise' as const,
        taskId: createdExercices[1].id,
        attemptNumber: 1,
        timeSpent: 180, // 3 minutes
        status: 'failed' as const,
        score: 40.0,
        metadata: {
          stepsCompleted: 2,
          totalSteps: 5,
          hintsUsed: 1,
        },
      },
      // Quiz équations et inéquations - Réussi
      {
        studentId: childUser.id,
        moduleId: createdModules[1].id,
        taskType: 'quiz' as const,
        taskId: createdQuizQuestions[2].id,
        attemptNumber: 1,
        timeSpent: 240, // 4 minutes
        status: 'succeeded' as const,
        score: 78.0,
        metadata: {
          questionsAnswered: 8,
          totalQuestions: 8,
          correctAnswers: 6,
          incorrectAnswers: 2,
        },
      },
      // Exercice inéquations - Échoué puis réussi
      {
        studentId: childUser.id,
        moduleId: createdModules[1].id,
        taskType: 'exercise' as const,
        taskId: createdExercices[2].id,
        attemptNumber: 1,
        timeSpent: 120, // 2 minutes
        status: 'failed' as const,
        score: 20.0,
        metadata: {
          stepsCompleted: 1,
          totalSteps: 4,
          hintsUsed: 0,
        },
      },
      {
        studentId: childUser.id,
        moduleId: createdModules[1].id,
        taskType: 'exercise' as const,
        taskId: createdExercices[2].id,
        attemptNumber: 2,
        timeSpent: 300, // 5 minutes
        status: 'succeeded' as const,
        score: 100.0,
        metadata: {
          stepsCompleted: 4,
          totalSteps: 4,
          hintsUsed: 1,
        },
      },
      // Exercice système d'équations - Réussi
      {
        studentId: childUser.id,
        moduleId: createdModules[1].id,
        taskType: 'exercise' as const,
        taskId: createdExercices[3].id,
        attemptNumber: 1,
        timeSpent: 480, // 8 minutes
        status: 'succeeded' as const,
        score: 95.0,
        metadata: {
          stepsCompleted: 3,
          totalSteps: 3,
          hintsUsed: 0,
        },
      },
      // Quiz vecteurs - Réussi
      {
        studentId: childUser.id,
        moduleId: createdModules[2].id,
        taskType: 'quiz' as const,
        taskId: createdQuizQuestions[4].id,
        attemptNumber: 1,
        timeSpent: 360, // 6 minutes
        status: 'succeeded' as const,
        score: 88.0,
        metadata: {
          questionsAnswered: 12,
          totalQuestions: 12,
          correctAnswers: 10,
          incorrectAnswers: 2,
        },
      },
      // Exercice calcul vectoriel - Réussi
      {
        studentId: childUser.id,
        moduleId: createdModules[2].id,
        taskType: 'exercise' as const,
        taskId: createdExercices[4].id,
        attemptNumber: 1,
        timeSpent: 420, // 7 minutes
        status: 'succeeded' as const,
        score: 100.0,
        metadata: {
          stepsCompleted: 6,
          totalSteps: 6,
          hintsUsed: 0,
        },
      },
      // Exercice translations - Échoué
      {
        studentId: childUser.id,
        moduleId: createdModules[2].id,
        taskType: 'exercise' as const,
        taskId: createdExercices[5].id,
        attemptNumber: 1,
        timeSpent: 200, // 3.3 minutes
        status: 'failed' as const,
        score: 30.0,
        metadata: {
          stepsCompleted: 1,
          totalSteps: 3,
          hintsUsed: 2,
        },
      },
      // Quiz probabilités - Réussi
      {
        studentId: childUser.id,
        moduleId: createdModules[3].id,
        taskType: 'quiz' as const,
        taskId: createdQuizQuestions[6].id,
        attemptNumber: 1,
        timeSpent: 540, // 9 minutes
        status: 'succeeded' as const,
        score: 95.0,
        metadata: {
          questionsAnswered: 15,
          totalQuestions: 15,
          correctAnswers: 14,
          incorrectAnswers: 1,
        },
      },
      // Exercice probabilités conditionnelles - Réussi
      {
        studentId: childUser.id,
        moduleId: createdModules[3].id,
        taskType: 'exercise' as const,
        taskId: createdExercices[6].id,
        attemptNumber: 1,
        timeSpent: 600, // 10 minutes
        status: 'succeeded' as const,
        score: 100.0,
        metadata: {
          stepsCompleted: 4,
          totalSteps: 4,
          hintsUsed: 0,
        },
      },
      // Exercice loi binomiale - Échoué puis réussi
      {
        studentId: childUser.id,
        moduleId: createdModules[3].id,
        taskType: 'exercise' as const,
        taskId: createdExercices[7].id,
        attemptNumber: 1,
        timeSpent: 180, // 3 minutes
        status: 'failed' as const,
        score: 25.0,
        metadata: {
          stepsCompleted: 1,
          totalSteps: 5,
          hintsUsed: 1,
        },
      },
      {
        studentId: childUser.id,
        moduleId: createdModules[3].id,
        taskType: 'exercise' as const,
        taskId: createdExercices[7].id,
        attemptNumber: 2,
        timeSpent: 480, // 8 minutes
        status: 'succeeded' as const,
        score: 100.0,
        metadata: {
          stepsCompleted: 5,
          totalSteps: 5,
          hintsUsed: 1,
        },
      },
      // Quiz mécanique - Réussi
      {
        studentId: childUser.id,
        moduleId: createdModules[4].id,
        taskType: 'quiz' as const,
        taskId: createdQuizQuestions[8].id,
        attemptNumber: 1,
        timeSpent: 300, // 5 minutes
        status: 'succeeded' as const,
        score: 82.0,
        metadata: {
          questionsAnswered: 10,
          totalQuestions: 10,
          correctAnswers: 8,
          incorrectAnswers: 2,
        },
      },
      // Exercice mécanique - Réussi
      {
        studentId: childUser.id,
        moduleId: createdModules[4].id,
        taskType: 'exercise' as const,
        taskId: createdExercices[8].id,
        attemptNumber: 1,
        timeSpent: 360, // 6 minutes
        status: 'succeeded' as const,
        score: 100.0,
        metadata: {
          stepsCompleted: 3,
          totalSteps: 3,
          hintsUsed: 0,
        },
      },
      // Quiz chimie - Réussi
      {
        studentId: childUser.id,
        moduleId: createdModules[5].id,
        taskType: 'quiz' as const,
        taskId: createdQuizQuestions[9].id,
        attemptNumber: 1,
        timeSpent: 420, // 7 minutes
        status: 'succeeded' as const,
        score: 90.0,
        metadata: {
          questionsAnswered: 12,
          totalQuestions: 12,
          correctAnswers: 10,
          incorrectAnswers: 2,
        },
      },
      // Exercice chimie - Réussi
      {
        studentId: childUser.id,
        moduleId: createdModules[5].id,
        taskType: 'exercise' as const,
        taskId: createdExercices[9].id,
        attemptNumber: 1,
        timeSpent: 540, // 9 minutes
        status: 'succeeded' as const,
        score: 100.0,
        metadata: {
          stepsCompleted: 4,
          totalSteps: 4,
          hintsUsed: 0,
        },
      },
    ]

    // Créer les activités de tâches
    for (const activityData of taskActivities) {
      await StudentTaskActivity.updateOrCreate(
        {
          studentId: activityData.studentId,
          moduleId: activityData.moduleId,
          taskType: activityData.taskType,
          taskId: activityData.taskId,
          attemptNumber: activityData.attemptNumber,
        },
        activityData
      )
    }
  }
}
