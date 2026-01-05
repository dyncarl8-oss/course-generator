import { useState, useEffect, useRef } from "react";
import { flushSync } from "react-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CourseBuilderHeader } from "@/components/course-builder-header";
import { CourseGenerator, CoursePreview } from "@/components/course-generator";
import { CourseCard } from "@/components/course-card";
import { BookOpen, Users, TrendingUp, Sparkles, LayoutGrid, DollarSign } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { generateCourseImage } from "@/lib/image-generator";
import type { GeneratedCourse, Course } from "@shared/schema";

interface DashboardData {
  user: { id: string; username: string; email: string };
  courses: (Course & { moduleCount: number; lessonCount: number; studentCount: number })[];
  companyId: string;
  earnings: { 
    totalEarnings: number; 
    availableBalance: number;
    pendingBalance: number;
  };
}

export default function DashboardPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const [location, setLocation] = useLocation();

  const [activeTab, setActiveTab] = useState<"courses" | "create">(() => {
    const tab = new URLSearchParams(window.location.search).get("tab");
    return tab === "create" ? "create" : "courses";
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCourse, setGeneratedCourse] = useState<GeneratedCourse | null>(null);
  const { toast } = useToast();

  const setTabInUrl = (tab: "courses" | "create") => {
    if (!companyId) return;
    setLocation(tab === "create" ? `/dashboard/${companyId}?tab=create` : `/dashboard/${companyId}`);
  };

  // Check if any courses are still generating to enable polling
  const hasGeneratingCourses = (courses: DashboardData["courses"] | undefined) => 
    courses?.some(c => c.generationStatus === "generating") ?? false;

  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard", companyId],
    enabled: !!companyId,
    refetchInterval: (query) => {
      // Poll every 5 seconds if there are courses still generating
      const courses = query.state.data?.courses;
      return hasGeneratingCourses(courses) ? 5000 : false;
    },
  });

  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [publishingCourseId, setPublishingCourseId] = useState<string | null>(null);
  const createTabRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get("tab");
    setActiveTab(tab === "create" ? "create" : "courses");
  }, [location]);

  useEffect(() => {
    if (activeTab === "create" && createTabRef.current) {
      createTabRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [activeTab]);

  const [savingStatus, setSavingStatus] = useState<string>("");
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);

  const saveMutation = useMutation({
    mutationFn: async (courseData: { generatedCourse: GeneratedCourse; isFree: boolean; price: string; coverImage?: string; generateLessonImages?: boolean }) => {
      return apiRequest("POST", `/api/dashboard/${companyId}/courses`, courseData);
    },
    onMutate: async (courseData) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ["/api/dashboard", companyId] });
      
      // Snapshot the previous value
      const previousData = queryClient.getQueryData<DashboardData>(["/api/dashboard", companyId]);
      
      // Optimistically add the new course to the list with all required fields
      if (previousData) {
        const now = new Date().toISOString();
        const optimisticCourse = {
          id: `temp-${Date.now()}`,
          creatorId: previousData.user.id,
          title: courseData.generatedCourse.course_title,
          description: courseData.generatedCourse.description || null,
          coverImage: courseData.coverImage || null,
          published: false,
          isFree: courseData.isFree,
          price: courseData.isFree ? "0" : courseData.price,
          generationStatus: courseData.generateLessonImages ? "generating" as const : "complete" as const,
          createdAt: now,
          updatedAt: now,
          moduleCount: courseData.generatedCourse.modules.length,
          lessonCount: courseData.generatedCourse.modules.reduce((acc, m) => acc + m.lessons.length, 0),
          studentCount: 0,
        };
        
        queryClient.setQueryData<DashboardData>(["/api/dashboard", companyId], {
          ...previousData,
          courses: [optimisticCourse as any, ...previousData.courses],
        });
      }
      
      return { previousData };
    },
    onSuccess: () => {
      // Refresh to get the real course data from server
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard", companyId] });
      setIsGeneratingImages(false);
    },
    onError: (_, __, context) => {
      // Rollback to previous data on error
      if (context?.previousData) {
        queryClient.setQueryData(["/api/dashboard", companyId], context.previousData);
      }
      setIsGeneratingImages(false);
      toast({
        title: "Failed to save",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const handleSaveCourse = async (options: { isFree: boolean; price: string; generateLessonImages: boolean }) => {
    if (!generatedCourse || isGeneratingImage || saveMutation.isPending) return;
    
    // Store the course data before clearing state
    const courseToSave = generatedCourse;
    
    setIsGeneratingImage(true);
    setIsGeneratingImages(options.generateLessonImages);
    setSavingStatus("Generating cover image...");
    
    let coverImage: string | undefined;
    try {
      const generatedImage = await generateCourseImage(courseToSave.course_title);
      coverImage = generatedImage || undefined;
    } catch (error) {
      console.error("Failed to generate cover image:", error);
    }
    
    // Use flushSync to force synchronous state updates BEFORE mutation
    // This ensures CoursePreview unmounts and tab switches before mutation enters pending state
    flushSync(() => {
      setIsGeneratingImage(false);
      setSavingStatus("");
      setGeneratedCourse(null);
      setActiveTab("courses");
    });

    setTabInUrl("courses");
    
    // Show toast immediately
    toast({
      title: "Creating your course...",
      description: options.generateLessonImages 
        ? "Your course is being created. You'll receive a notification when lesson images are ready."
        : "Your course is being created.",
    });
    
    // Now trigger the mutation - the UI has already switched to courses tab
    saveMutation.mutate({
      generatedCourse: courseToSave,
      isFree: options.isFree,
      price: options.price,
      coverImage,
      generateLessonImages: options.generateLessonImages,
    });
  };

  const togglePublishMutation = useMutation({
    mutationFn: async ({ courseId, published }: { courseId: string; published: boolean }) => {
      setPublishingCourseId(courseId);
      return apiRequest("PATCH", `/api/dashboard/${companyId}/courses/${courseId}`, { published });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard", companyId] });
      setPublishingCourseId(null);
    },
    onError: () => {
      setPublishingCourseId(null);
    },
  });

  if (error) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <Card className="max-w-sm w-full">
          <CardHeader className="text-center py-8">
            <CardTitle className="text-destructive text-lg">Access Denied</CardTitle>
            <CardDescription>
              You don't have admin access to this dashboard.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full bg-background flex flex-col">
        {companyId ? <CourseBuilderHeader companyId={companyId} /> : null}
        <div className="p-5 space-y-5">
          <div className="flex items-center justify-between">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-9 w-28" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const stats = {
    totalCourses: data?.courses.length || 0,
    publishedCourses: data?.courses.filter((c) => c.published).length || 0,
    totalStudents: data?.courses.reduce((acc, c) => acc + c.studentCount, 0) || 0,
    totalEarnings: Number(data?.earnings?.totalEarnings ?? 0) || 0,
    availableBalance: Number(data?.earnings?.availableBalance ?? 0) || 0,
  };

  return (
    <div className="h-full bg-background flex flex-col">
      {companyId ? (
        <CourseBuilderHeader companyId={companyId} availableBalance={stats.availableBalance} />
      ) : null}

      <div className="flex-1 overflow-auto p-5 space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={DollarSign} label="Your Total Earnings" value={stats.totalEarnings} testId="stat-earnings" bgColor="bg-amber-500/10 dark:bg-amber-400/10" iconColor="text-amber-600 dark:text-amber-400" isCurrency />
          <StatCard icon={BookOpen} label="Total Courses" value={stats.totalCourses} testId="stat-total-courses" bgColor="bg-blue-500/10 dark:bg-blue-400/10" iconColor="text-blue-600 dark:text-blue-400" />
          <StatCard icon={TrendingUp} label="Published" value={stats.publishedCourses} testId="stat-published" bgColor="bg-emerald-500/10 dark:bg-emerald-400/10" iconColor="text-emerald-600 dark:text-emerald-400" />
          <StatCard icon={Users} label="Total Students" value={stats.totalStudents} testId="stat-students" bgColor="bg-violet-500/10 dark:bg-violet-400/10" iconColor="text-violet-600 dark:text-violet-400" />
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setTabInUrl(value as "courses" | "create")}>
          <TabsList className="mb-5">
            <TabsTrigger value="courses" className="gap-2" data-testid="tab-courses">
              <LayoutGrid className="h-4 w-4" />
              Courses
            </TabsTrigger>
            <TabsTrigger value="create" className="gap-2" data-testid="tab-create">
              <Sparkles className="h-4 w-4" />
              Create
            </TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="mt-5">
            {data?.courses && data.courses.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {data.courses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    companyId={companyId}
                    moduleCount={course.moduleCount}
                    lessonCount={course.lessonCount}
                    isCreator={true}
                    onTogglePublish={(id, published) =>
                      togglePublishMutation.mutate({ courseId: id, published })
                    }
                    isPublishing={publishingCourseId === course.id}
                  />
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <BookOpen className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-base font-semibold mb-1">No courses yet</h3>
                  <p className="text-sm text-muted-foreground mb-5 max-w-sm">
                    Create your first AI-powered course to get started.
                  </p>
                  <Button onClick={() => setTabInUrl("create")} data-testid="button-create-first-course">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Create Course
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="create" className="mt-5" ref={createTabRef}>
            <div className="max-w-2xl mx-auto">
              {!generatedCourse ? (
                <CourseGenerator
                  companyId={companyId || ""}
                  onGenerated={setGeneratedCourse}
                  isGenerating={isGenerating}
                  setIsGenerating={setIsGenerating}
                />
              ) : (
                <CoursePreview
                  course={generatedCourse}
                  onSave={handleSaveCourse}
                  onDiscard={() => setGeneratedCourse(null)}
                  isSaving={isGeneratingImage || saveMutation.isPending}
                  savingStatus={savingStatus}
                />
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

    </div>
  );
}

interface StatCardProps {
  icon: typeof BookOpen;
  label: string;
  value: number | string | null | undefined;
  testId: string;
  bgColor?: string;
  iconColor?: string;
  isCurrency?: boolean;
}

function StatCard({ icon: Icon, label, value, testId, bgColor = "bg-primary/10", iconColor = "text-primary", isCurrency }: StatCardProps) {
  const numericValue = Number(value) || 0;
  const displayValue = isCurrency ? "$" + numericValue.toFixed(2) : numericValue;
  return (
    <Card data-testid={testId}>
      <CardContent className="p-5">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-lg ${bgColor} flex items-center justify-center shrink-0`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-bold leading-none">{displayValue}</p>
            <p className="text-xs text-muted-foreground mt-1">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
