import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

const requestSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  requestType: z.enum(["web_dev", "app_dev", "prototype", "research"], {
    required_error: "Please select a request type",
  }),
  description: z.string().min(10, "Please provide a short description").max(2000).optional().or(z.literal("")),
  requirementsText: z.string().max(4000).optional().or(z.literal("")),
});

type RequestFormValues = z.infer<typeof requestSchema>;

const typeOptions = [
  { value: "web_dev", label: "Web Development" },
  { value: "app_dev", label: "App Development" },
  { value: "prototype", label: "Prototyping" },
  { value: "research", label: "Research" },
];

export default function SubmitRequest() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      title: "",
      requestType: undefined as unknown as RequestFormValues["requestType"],
      description: "",
      requirementsText: "",
    },
  });

  const onSubmit = async (values: RequestFormValues) => {
    setSubmitting(true);
    try {
      // Convert requirementsText (one per line or comma-separated) to string[]
      const requirements = (values.requirementsText || "")
        .split(/\r?\n|,/)
        .map((s) => s.trim())
        .filter(Boolean);

      const createRes = await api.post("/requests", {
        title: values.title,
        requestType: values.requestType,
        description: values.description || undefined,
        requirements,
      });

      // Automatically generate workflow after submission
      const newId = createRes.data?.data?.request?._id as string | undefined;
      if (newId) {
        try {
          await api.post(`/requests/${newId}/generate-workflow`);
        } catch (e) {
          // Non-fatal; manager can generate later
          console.warn('Auto-generate workflow failed:', e);
        }
      }

      toast({
        title: "Request submitted",
        description: newId ? "Workflow generation initiated automatically." : "Your request has been submitted for review.",
      });
      navigate("/client");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg = axiosErr?.response?.data?.message || "Failed to submit request. Please try again.";
      toast({ title: "Submission failed", description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-foreground mb-8">Submit a New Request</h1>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>New Project Details</CardTitle>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="requestType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Request Type</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a type" />
                          </SelectTrigger>
                          <SelectContent>
                            {typeOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                      <FormLabel>Short Description</FormLabel>
                      <FormControl>
                        <Input placeholder="A brief summary of what you need" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="requirementsText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Requirements</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={6}
                        placeholder={"List your requirements (one per line).\nExamples:\n- Responsive design\n- Admin dashboard\n- Email notifications"}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center gap-3">
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Request"}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={submitting}>
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
