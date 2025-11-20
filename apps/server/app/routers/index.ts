import { adminAuthRouter } from '#routers/admin_auth_router'
import { adminRouter } from '#routers/admin_router'
import { chapterRouter } from '#routers/chapter'
import { exerciceRouter } from '#routers/exercice_router'
import { faqRouter } from '#routers/faq_router'
import { fileRouter } from '#routers/file_router'
import { interactiveExerciseRouter } from '#routers/interactive_exercise_router'
import { moduleRouter } from '#routers/module_router'
import { oneTimePeriodRouter } from '#routers/one_time_period_router'
import { pastPaperRouter } from '#routers/past_paper_router'
import { paymentRouter } from '#routers/payment_router'
import { professorAuthRouter } from '#routers/professor_auth_router'
import { professorAvailabilitiesRouter } from '#routers/professor_availability_router'
import { professorRouter } from '#routers/professor_router'
import { questionRouter } from '#routers/question_router'
import { ratingRouter } from '#routers/rating_router'
import { reservationsRouter } from '#routers/reservation_router'
import { sheetRouter } from '#routers/sheet_router'
import { studentAvailabilitiesRouter } from '#routers/student_availability_router'
import { studentProgressRouter } from '#routers/student_progress_router'
import { subscriptionPlanRouter } from '#routers/subscription_plan_router'
import { summarizedSheetRouter } from '#routers/summarized_sheet_router'
import { userAuthRouter } from '#routers/user_auth_router'
import { userRouter } from '#routers/user_router'
import { videoSdkRouter } from '#routers/videosdk_router'
import { router } from '#services/trpc_service'

const appRouter = router({
  admin: adminRouter,
  adminAuth: adminAuthRouter,
  chapter: chapterRouter,
  exercice: exerciceRouter,
  faq: faqRouter,
  file: fileRouter,
  module: moduleRouter,
  oneTimePeriod: oneTimePeriodRouter,
  pastPaper: pastPaperRouter,
  payment: paymentRouter,
  professor: professorRouter,
  professorAuth: professorAuthRouter,
  professorAvailabilities: professorAvailabilitiesRouter,
  question: questionRouter,
  interactiveExercise: interactiveExerciseRouter,
  rating: ratingRouter,
  reservations: reservationsRouter,
  sheet: sheetRouter,
  studentAvailabilities: studentAvailabilitiesRouter,
  studentProgress: studentProgressRouter,
  summarizedSheet: summarizedSheetRouter,
  subscriptionPlan: subscriptionPlanRouter,
  user: userRouter,
  userAuth: userAuthRouter,
  videoSdk: videoSdkRouter,
})

export type AppRouter = typeof appRouter
export default appRouter
