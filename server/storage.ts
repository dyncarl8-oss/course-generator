import { 
  UserModel, CourseModel, ModuleModel, LessonModel, CourseAccessModel,
  PaymentModel, CreatorEarningsModel, AdminBalanceModel,
  type User, type InsertUser, 
  type Course, type InsertCourse,
  type Module, type InsertModule,
  type Lesson, type InsertLesson, type MediaItem,
  type CourseAccess, type InsertCourseAccess,
  type Payment, type InsertPayment,
  type CreatorEarnings,
  type AdminBalance,
  type CourseWithModules
} from "@shared/schema";
import { randomUUID } from "crypto";

function docToUser(doc: any): User {
  return {
    id: doc._id,
    whopUserId: doc.whopUserId,
    email: doc.email || null,
    username: doc.username || null,
    profilePicUrl: doc.profilePicUrl || null,
    role: doc.role,
    whopCompanyId: doc.whopCompanyId || null,
    createdAt: doc.createdAt,
  };
}

function docToCourse(doc: any): Course {
  return {
    id: doc._id,
    creatorId: doc.creatorId,
    title: doc.title,
    description: doc.description || null,
    coverImage: doc.coverImage || null,
    published: doc.published,
    isFree: doc.isFree,
    price: doc.price || null,
    generationStatus: doc.generationStatus || "complete",
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function docToModule(doc: any): Module {
  return {
    id: doc._id,
    courseId: doc.courseId,
    title: doc.title,
    orderIndex: doc.orderIndex,
    createdAt: doc.createdAt,
  };
}

function docToLesson(doc: any): Lesson {
  return {
    id: doc._id,
    moduleId: doc.moduleId,
    title: doc.title,
    content: doc.content,
    orderIndex: doc.orderIndex,
    media: (doc.media || []).map((m: any) => ({
      id: m.id,
      type: m.type,
      url: m.url,
      alt: m.alt,
      caption: m.caption,
      placement: m.placement,
      prompt: m.prompt,
    })),
    createdAt: doc.createdAt,
  };
}

function docToCourseAccess(doc: any): CourseAccess {
  return {
    id: doc._id,
    courseId: doc.courseId,
    userId: doc.userId,
    grantedAt: doc.grantedAt,
    purchasedViaWhop: doc.purchasedViaWhop ?? null,
  };
}

function docToPayment(doc: any): Payment {
  return {
    id: doc._id,
    courseId: doc.courseId,
    buyerId: doc.buyerId,
    creatorId: doc.creatorId,
    amount: doc.amount,
    whopPaymentId: doc.whopPaymentId,
    whopCheckoutId: doc.whopCheckoutId,
    status: doc.status,
    createdAt: doc.createdAt,
    completedAt: doc.completedAt || null,
  };
}

function docToCreatorEarnings(doc: any): CreatorEarnings {
  return {
    id: doc._id,
    creatorId: doc.creatorId,
    totalEarnings: doc.totalEarnings,
    availableBalance: doc.availableBalance,
    pendingBalance: doc.pendingBalance,
    updatedAt: doc.updatedAt,
  };
}

function docToAdminBalance(doc: any): AdminBalance {
  return {
    id: doc._id,
    totalEarnings: doc.totalEarnings,
    availableBalance: doc.availableBalance,
    updatedAt: doc.updatedAt,
  };
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByWhopId(whopUserId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  
  getCourse(id: string): Promise<Course | undefined>;
  getCourseWithModules(id: string): Promise<CourseWithModules | undefined>;
  getCoursesByCreator(creatorId: string): Promise<Course[]>;
  getPublishedCourses(): Promise<Course[]>;
  getPublishedCoursesByCompany(companyId: string): Promise<CourseWithModules[]>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: string, updates: Partial<Course>): Promise<Course | undefined>;
  deleteCourse(id: string): Promise<void>;
  
  getModule(id: string): Promise<Module | undefined>;
  getModulesByCourse(courseId: string): Promise<Module[]>;
  createModule(module: InsertModule): Promise<Module>;
  updateModule(id: string, updates: Partial<Module>): Promise<Module | undefined>;
  deleteModule(id: string): Promise<void>;
  
  getLesson(id: string): Promise<Lesson | undefined>;
  getLessonsByModule(moduleId: string): Promise<Lesson[]>;
  createLesson(lesson: InsertLesson): Promise<Lesson>;
  updateLesson(id: string, updates: Partial<Lesson>): Promise<Lesson | undefined>;
  deleteLesson(id: string): Promise<void>;
  
  getCourseAccess(courseId: string, userId: string): Promise<CourseAccess | undefined>;
  getCourseAccessByUser(userId: string): Promise<CourseAccess[]>;
  getCourseAccessByCourse(courseId: string): Promise<(CourseAccess & { user: User })[]>;
  grantCourseAccess(access: InsertCourseAccess): Promise<CourseAccess>;
  revokeCourseAccess(courseId: string, userId: string): Promise<void>;
  
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPaymentByCheckoutId(checkoutId: string): Promise<Payment | undefined>;
  getPaymentsByCourse(courseId: string): Promise<Payment[]>;
  updatePaymentStatus(id: string, status: Payment["status"], whopPaymentId?: string): Promise<Payment | undefined>;
  
  getCreatorEarnings(creatorId: string): Promise<CreatorEarnings | undefined>;
  addCreatorEarnings(creatorId: string, amount: number): Promise<CreatorEarnings>;
  
  getAdminBalance(): Promise<AdminBalance | undefined>;
  addAdminEarnings(amount: number): Promise<AdminBalance>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const doc = await UserModel.findById(id);
    return doc ? docToUser(doc) : undefined;
  }

  async getUserByWhopId(whopUserId: string): Promise<User | undefined> {
    const doc = await UserModel.findOne({ whopUserId });
    return doc ? docToUser(doc) : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const doc = await UserModel.create({
      _id: insertUser.id,
      whopUserId: insertUser.whopUserId,
      email: insertUser.email,
      username: insertUser.username,
      profilePicUrl: insertUser.profilePicUrl,
      role: insertUser.role || "member",
      whopCompanyId: insertUser.whopCompanyId,
    });
    return docToUser(doc);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const updateObj: any = { ...updates };
    if ('id' in updateObj) delete updateObj.id;
    
    const doc = await UserModel.findByIdAndUpdate(id, updateObj, { new: true });
    return doc ? docToUser(doc) : undefined;
  }

  async getCourse(id: string): Promise<Course | undefined> {
    const doc = await CourseModel.findById(id);
    return doc ? docToCourse(doc) : undefined;
  }

  async getCourseWithModules(id: string): Promise<CourseWithModules | undefined> {
    const course = await this.getCourse(id);
    if (!course) return undefined;

    const [moduleDocs, creatorDoc] = await Promise.all([
      ModuleModel.find({ courseId: id }).sort({ orderIndex: 1 }),
      UserModel.findById(course.creatorId)
    ]);
    
    const moduleIds = moduleDocs.map(m => m._id);
    const allLessonDocs = await LessonModel.find({ moduleId: { $in: moduleIds } }).sort({ orderIndex: 1 });
    
    const lessonsByModule = new Map<string, typeof allLessonDocs>();
    for (const lesson of allLessonDocs) {
      const moduleId = lesson.moduleId;
      if (!lessonsByModule.has(moduleId)) {
        lessonsByModule.set(moduleId, []);
      }
      lessonsByModule.get(moduleId)!.push(lesson);
    }
    
    const modulesWithLessons = moduleDocs.map(moduleDoc => ({
      ...docToModule(moduleDoc),
      lessons: (lessonsByModule.get(moduleDoc._id) || []).map(docToLesson),
    }));

    const creator = creatorDoc ? docToUser(creatorDoc) : undefined;

    return { ...course, modules: modulesWithLessons, creator };
  }

  async getCoursesByCreator(creatorId: string): Promise<Course[]> {
    const docs = await CourseModel.find({ creatorId }).sort({ createdAt: -1 });
    return docs.map(docToCourse);
  }

  async getPublishedCourses(): Promise<Course[]> {
    const docs = await CourseModel.find({ published: true }).sort({ createdAt: -1 });
    return docs.map(docToCourse);
  }

  async getPublishedCoursesByCompany(companyId: string): Promise<CourseWithModules[]> {
    const creators = await UserModel.find({ whopCompanyId: companyId });
    const creatorIds = creators.map(c => c._id);
    
    const courseDocs = await CourseModel.find({ 
      creatorId: { $in: creatorIds }, 
      published: true 
    }).sort({ createdAt: -1 });

    const result: CourseWithModules[] = [];
    for (const courseDoc of courseDocs) {
      const courseWithModules = await this.getCourseWithModules(courseDoc._id);
      if (courseWithModules) {
        const creator = creators.find(c => c._id === courseDoc.creatorId);
        result.push({ ...courseWithModules, creator: creator ? docToUser(creator) : undefined });
      }
    }
    return result;
  }

  async createCourse(insertCourse: InsertCourse): Promise<Course> {
    const id = randomUUID();
    const doc = await CourseModel.create({
      _id: id,
      creatorId: insertCourse.creatorId,
      title: insertCourse.title,
      description: insertCourse.description,
      coverImage: insertCourse.coverImage,
      published: insertCourse.published ?? false,
      isFree: insertCourse.isFree ?? true,
      price: insertCourse.price || "0",
      generationStatus: insertCourse.generationStatus ?? "complete",
    });
    return docToCourse(doc);
  }

  async updateCourse(id: string, updates: Partial<Course>): Promise<Course | undefined> {
    const updateObj: any = { ...updates, updatedAt: new Date() };
    if ('id' in updateObj) delete updateObj.id;
    
    const doc = await CourseModel.findByIdAndUpdate(id, updateObj, { new: true });
    return doc ? docToCourse(doc) : undefined;
  }

  async deleteCourse(id: string): Promise<void> {
    const modules = await ModuleModel.find({ courseId: id });
    for (const mod of modules) {
      await LessonModel.deleteMany({ moduleId: mod._id });
    }
    await ModuleModel.deleteMany({ courseId: id });
    await CourseAccessModel.deleteMany({ courseId: id });
    await CourseModel.findByIdAndDelete(id);
  }

  async getModule(id: string): Promise<Module | undefined> {
    const doc = await ModuleModel.findById(id);
    return doc ? docToModule(doc) : undefined;
  }

  async getModulesByCourse(courseId: string): Promise<Module[]> {
    const docs = await ModuleModel.find({ courseId }).sort({ orderIndex: 1 });
    return docs.map(docToModule);
  }

  async createModule(insertModule: InsertModule): Promise<Module> {
    const id = randomUUID();
    const doc = await ModuleModel.create({
      _id: id,
      courseId: insertModule.courseId,
      title: insertModule.title,
      orderIndex: insertModule.orderIndex,
    });
    return docToModule(doc);
  }

  async updateModule(id: string, updates: Partial<Module>): Promise<Module | undefined> {
    const updateObj: any = { ...updates };
    if ('id' in updateObj) delete updateObj.id;
    
    const doc = await ModuleModel.findByIdAndUpdate(id, updateObj, { new: true });
    return doc ? docToModule(doc) : undefined;
  }

  async deleteModule(id: string): Promise<void> {
    await LessonModel.deleteMany({ moduleId: id });
    await ModuleModel.findByIdAndDelete(id);
  }

  async getLesson(id: string): Promise<Lesson | undefined> {
    const doc = await LessonModel.findById(id);
    return doc ? docToLesson(doc) : undefined;
  }

  async getLessonsByModule(moduleId: string): Promise<Lesson[]> {
    const docs = await LessonModel.find({ moduleId }).sort({ orderIndex: 1 });
    return docs.map(docToLesson);
  }

  async createLesson(insertLesson: InsertLesson): Promise<Lesson> {
    const id = randomUUID();
    const doc = await LessonModel.create({
      _id: id,
      moduleId: insertLesson.moduleId,
      title: insertLesson.title,
      content: insertLesson.content,
      orderIndex: insertLesson.orderIndex,
      media: insertLesson.media || [],
    });
    return docToLesson(doc);
  }

  async updateLesson(id: string, updates: Partial<Lesson>): Promise<Lesson | undefined> {
    const updateObj: any = { ...updates };
    if ('id' in updateObj) delete updateObj.id;
    
    const doc = await LessonModel.findByIdAndUpdate(id, updateObj, { new: true });
    return doc ? docToLesson(doc) : undefined;
  }

  async addLessonMedia(lessonId: string, media: MediaItem): Promise<Lesson | undefined> {
    const doc = await LessonModel.findByIdAndUpdate(
      lessonId,
      { $push: { media } },
      { new: true }
    );
    return doc ? docToLesson(doc) : undefined;
  }

  async deleteLesson(id: string): Promise<void> {
    await LessonModel.findByIdAndDelete(id);
  }

  async getCourseAccess(courseId: string, userId: string): Promise<CourseAccess | undefined> {
    const doc = await CourseAccessModel.findOne({ courseId, userId });
    return doc ? docToCourseAccess(doc) : undefined;
  }

  async getCourseAccessByUser(userId: string): Promise<CourseAccess[]> {
    const docs = await CourseAccessModel.find({ userId });
    return docs.map(docToCourseAccess);
  }

  async getCourseAccessByCourse(courseId: string): Promise<(CourseAccess & { user: User })[]> {
    const accessDocs = await CourseAccessModel.find({ courseId });
    
    if (accessDocs.length === 0) {
      return [];
    }
    
    const userIds = accessDocs.map(a => a.userId);
    const userDocs = await UserModel.find({ _id: { $in: userIds } });
    const userMap = new Map(userDocs.map(u => [u._id, u]));
    
    const result: (CourseAccess & { user: User })[] = [];
    for (const accessDoc of accessDocs) {
      const userDoc = userMap.get(accessDoc.userId);
      if (userDoc) {
        result.push({
          ...docToCourseAccess(accessDoc),
          user: docToUser(userDoc),
        });
      }
    }
    
    return result;
  }

  async grantCourseAccess(insertAccess: InsertCourseAccess): Promise<CourseAccess> {
    const id = randomUUID();
    const doc = await CourseAccessModel.create({
      _id: id,
      courseId: insertAccess.courseId,
      userId: insertAccess.userId,
      purchasedViaWhop: insertAccess.purchasedViaWhop ?? false,
    });
    return docToCourseAccess(doc);
  }

  async revokeCourseAccess(courseId: string, userId: string): Promise<void> {
    await CourseAccessModel.deleteOne({ courseId, userId });
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const id = randomUUID();
    const doc = await PaymentModel.create({
      _id: id,
      courseId: insertPayment.courseId,
      buyerId: insertPayment.buyerId,
      creatorId: insertPayment.creatorId,
      amount: insertPayment.amount,
      whopCheckoutId: insertPayment.whopCheckoutId,
      whopPaymentId: insertPayment.whopPaymentId || "",
      status: insertPayment.status || "pending",
    });
    return docToPayment(doc);
  }

  async getPaymentByCheckoutId(checkoutId: string): Promise<Payment | undefined> {
    const doc = await PaymentModel.findOne({ whopCheckoutId: checkoutId });
    return doc ? docToPayment(doc) : undefined;
  }

  async getPaymentsByCourse(courseId: string): Promise<Payment[]> {
    const docs = await PaymentModel.find({ courseId, status: "completed" }).sort({ createdAt: -1 });
    return docs.map(docToPayment);
  }

  async updatePaymentStatus(id: string, status: Payment["status"], whopPaymentId?: string): Promise<Payment | undefined> {
    const updateObj: any = { status };
    if (status === "completed") {
      updateObj.completedAt = new Date();
    }
    if (whopPaymentId) {
      updateObj.whopPaymentId = whopPaymentId;
    }
    const doc = await PaymentModel.findByIdAndUpdate(id, updateObj, { new: true });
    return doc ? docToPayment(doc) : undefined;
  }

  async getCreatorEarnings(creatorId: string): Promise<CreatorEarnings | undefined> {
    const doc = await CreatorEarningsModel.findOne({ creatorId });
    return doc ? docToCreatorEarnings(doc) : undefined;
  }

  async addCreatorEarnings(creatorId: string, amount: number): Promise<CreatorEarnings> {
    const existing = await CreatorEarningsModel.findOne({ creatorId });
    
    if (existing) {
      const doc = await CreatorEarningsModel.findByIdAndUpdate(
        existing._id,
        {
          $inc: { totalEarnings: amount, availableBalance: amount },
          updatedAt: new Date(),
        },
        { new: true }
      );
      return docToCreatorEarnings(doc!);
    } else {
      const id = randomUUID();
      const doc = await CreatorEarningsModel.create({
        _id: id,
        creatorId,
        totalEarnings: amount,
        availableBalance: amount,
        pendingBalance: 0,
      });
      return docToCreatorEarnings(doc);
    }
  }

  async getAdminBalance(): Promise<AdminBalance | undefined> {
    const doc = await AdminBalanceModel.findOne({});
    return doc ? docToAdminBalance(doc) : undefined;
  }

  async addAdminEarnings(amount: number): Promise<AdminBalance> {
    const existing = await AdminBalanceModel.findOne({});
    
    if (existing) {
      const doc = await AdminBalanceModel.findByIdAndUpdate(
        existing._id,
        {
          $inc: { totalEarnings: amount, availableBalance: amount },
          updatedAt: new Date(),
        },
        { new: true }
      );
      return docToAdminBalance(doc!);
    } else {
      const id = randomUUID();
      const doc = await AdminBalanceModel.create({
        _id: id,
        totalEarnings: amount,
        availableBalance: amount,
      });
      return docToAdminBalance(doc);
    }
  }
}

export const storage = new DatabaseStorage();
