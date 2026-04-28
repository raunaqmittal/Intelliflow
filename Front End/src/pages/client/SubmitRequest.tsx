import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Loader2 } from "lucide-react";
import api from "@/lib/api";

const requestSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(500, "Description cannot exceed 500 characters"),
  requirementsText: z.string().max(4000).optional().or(z.literal("")),
});

type RequestFormValues = z.infer<typeof requestSchema>;

export default function SubmitRequest() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [loadingStage, setLoadingStage] = useState<"submitting" | "analysing" | null>(null);

  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      title: "",
      description: "",
      requirementsText: "",
    },
  });

  const onSubmit = async (values: RequestFormValues) => {
    setSubmitting(true);
    setLoadingStage("submitting");
    try {
      // Convert requirementsText (one per line or comma-separated) to string[]
      const requirements = (values.requirementsText || "")
        .split(/\r?\n|,/)
        .map((s) => s.trim())
        .filter(Boolean);

      const createRes = await api.post("/requests", {
        title: values.title,
        description: values.description,
        requirements,
        // No requestType — AI determines this automatically
      });

      const newId = createRes.data?.data?.request?._id as string | undefined;

      if (newId) {
        setLoadingStage("analysing");
        try {
          const workflowRes = await api.post(`/requests/${newId}/generate-workflow`);

          // Handle out-of-scope response
          if (workflowRes.data?.status === "out_of_scope") {
            toast({
              title: "Request reviewed by AI",
              description:
                "Your request was reviewed — see details for more information.",
            });
            navigate("/client/my-requests");
            return;
          }
        } catch (e) {
          // Non-fatal — manager can generate workflow manually later
          console.warn("Auto-generate workflow failed:", e);
        }
      }

      toast({
        title: "Request submitted",
        description: "Your request has been submitted and analysed by AI.",
      });
      navigate("/client/my-requests");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg =
        axiosErr?.response?.data?.message ||
        "Failed to submit request. Please try again.";
      toast({ title: "Submission failed", description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
      setLoadingStage(null);
    }
  };

  const loadingLabel =
    loadingStage === "analysing"
      ? "Analysing your request with AI..."
      : "Submitting...";

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-foreground mb-8">Submit a New Request</h1>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>New Project Details</CardTitle>
          <CardDescription className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="flex items-center gap-1 text-xs">
              <Sparkles className="h-3 w-3" />
              AI-Powered
            </Badge>
            <span>
              Our AI will automatically identify your project type and generate a
              tailored workflow plan.
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Marketing Website Revamp" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        placeholder="Describe what you need in detail. The more context you provide, the better the AI can plan your project."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="requirementsText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Requirements</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={6}
                        placeholder={
                          "List your requirements (one per line).\nExamples:\n- Responsive design\n- Admin dashboard\n- Email notifications"
                        }
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center gap-3">
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {loadingLabel}
                    </>
                  ) : (
                    "Submit Request"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
