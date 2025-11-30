import { Skeleton } from "@/components/ui/skeleton";

export function GroupPageSkeleton() {
    return (
        <div className="flex flex-col sm:ml-40 px-4 py-6 max-w-6xl mx-auto w-full space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-32" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-10" />
                </div>
            </div>

            <div className="mb-6">
                <Skeleton className="h-[80px] w-full rounded-xl" />
            </div>

            <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <Skeleton className="h-[400px] w-full rounded-lg" />
                </div>
                <div className="lg:col-span-1">
                    <Skeleton className="h-[200px] w-full rounded-lg" />
                </div>
            </div>
        </div>
    );
}
