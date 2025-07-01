
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { announcementSchema, type AnnouncementSchema } from "@/lib/formValidationSchemas";
import { useCreateAnnouncementMutation, useUpdateAnnouncementMutation } from "@/lib/redux/api/entityApi";
import type { Dispatch, SetStateAction } from "react";
import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import type { Announcement, Class } from "@/types/index";
import { CldUploadWidget } from "next-cloudinary";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { UploadCloud, FileText, Image as ImageIcon, Trash2, Loader2 } from "lucide-react";

// Define specific types for related data
type RelatedClass = Pick<Class, 'id' | 'name'>;

type UpdateAnnouncementData = Announcement;

interface CloudinaryUploadWidgetInfo {
  secure_url: string;
  resource_type: string;
}

interface CloudinaryUploadWidgetResults {
  event: "success" | string;
  info: CloudinaryUploadWidgetInfo | string | { public_id: string };
}

const AnnouncementForm = ({
  type,
  data,
  setOpen,
  relatedData,
}: {
  type: "create" | "update";
  data?: UpdateAnnouncementData;
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: { classes: RelatedClass[] };
}) => {
  const [uploadedFile, setUploadedFile] = useState<{ url: string; type: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<AnnouncementSchema>({
    resolver: zodResolver(announcementSchema),
    defaultValues: data ? {
      ...data,
      date: data.date ? new Date(data.date) : undefined,
      classId: data.classId,
    } : {
      title: "",
      description: "", // Initially empty, will be populated by upload
      date: undefined,
      classId: null,
    },
  });

  // Handle initial data for updates
  useEffect(() => {
    if (type === 'update' && data?.description) {
      try {
        const fileInfo = JSON.parse(data.description);
        if (fileInfo.fileUrl && fileInfo.fileType) {
          setUploadedFile({ url: fileInfo.fileUrl, type: fileInfo.fileType });
          setValue('description', data.description, { shouldValidate: true });
        }
      } catch (e) {
        // This is a legacy text announcement. This form can't edit it.
        // We could show a read-only view of the text, but for now we'll just ignore it.
      }
    }
  }, [data, type, setValue]);

  const router = useRouter();
  const [createAnnouncement, { isLoading: isCreating }] = useCreateAnnouncementMutation();
  const [updateAnnouncement, { isLoading: isUpdating }] = useUpdateAnnouncementMutation();

  const isLoading = isCreating || isUpdating;

  const onSubmit = handleSubmit(async (formData: AnnouncementSchema) => {
    try {
      if (type === "create") {
        await createAnnouncement(formData).unwrap();
      } else if (data?.id) {
        await updateAnnouncement({ ...formData, id: data.id }).unwrap();
      }
      toast({ title: `Annonce ${type === "create" ? "créée" : "mise à jour"} avec succès !` });
      setOpen(false);
      reset();
      router.refresh();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Échec de l'opération",
        description: err.data?.message || "Une erreur inattendue s'est produite.",
      });
    }
  });

  const classes = relatedData?.classes || [];

  const handleUploadSuccess = (result: CloudinaryUploadWidgetResults) => {
    if (result.event === "success" && typeof result.info === 'object' && 'secure_url' in result.info) {
      const info = result.info as CloudinaryUploadWidgetInfo;
      const file = { url: info.secure_url, type: info.resource_type };
      setUploadedFile(file);
      const descriptionValue = JSON.stringify({ fileUrl: file.url, fileType: file.type });
      setValue("description", descriptionValue, { shouldValidate: true });
    }
  };

  const removeUploadedFile = () => {
    setUploadedFile(null);
    setValue("description", "", { shouldValidate: true });
  }

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Publier une Nouvelle Annonce" : "Mettre à jour l'Annonce"}
      </h1>

      <div className="flex flex-col gap-4">
        <InputField
          label="Titre de l'Annonce"
          name="title"
          register={register}
          error={errors?.title}
          inputProps={{disabled: isLoading, className: "md:w-full"}}
        />
        <input type="hidden" {...register("description")} />
        
        <div className="space-y-2">
          <Label>Fichier de l'annonce</Label>
          {uploadedFile ? (
            <div className="p-4 border rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                {uploadedFile.type === 'image' ? <ImageIcon className="h-6 w-6 text-primary" /> : <FileText className="h-6 w-6 text-primary" />}
                <a href={uploadedFile.url} target="_blank" rel="noopener noreferrer" className="text-sm truncate hover:underline">{uploadedFile.url}</a>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={removeUploadedFile} disabled={isLoading}>
                <Trash2 className="h-4 w-4 text-destructive"/>
              </Button>
            </div>
          ) : (
            <CldUploadWidget
              uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "ml_default"}
              onSuccess={handleUploadSuccess}
            >
              {({ open }) => (
                <button 
                  type="button" 
                  onClick={() => open()} 
                  className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
                  disabled={isLoading}
                >
                  <UploadCloud className="h-10 w-10 text-muted-foreground mb-2"/>
                  <span className="font-semibold">Cliquez pour téléverser</span>
                  <span className="text-xs text-muted-foreground">PDF, PNG, JPG, etc.</span>
                </button>
              )}
            </CldUploadWidget>
          )}
          {errors.description && <p className="text-xs text-destructive mt-1">{errors.description.message?.toString()}</p>}
        </div>
      </div>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Date de publication"
          name="date"
          type="date"
          register={register}
          error={errors?.date}
          inputProps={{disabled: isLoading}}
        />
        <div className="flex flex-col gap-2 w-full md:w-1/4 flex-grow">
          <Label>Classe (Optionnel)</Label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full disabled:opacity-50"
            {...register("classId")}
            disabled={isLoading}
            defaultValue={data?.classId?.toString() ?? ""}
          >
            <option value="">Toutes les classes</option>
            {classes.map((cls: RelatedClass) => (
              <option value={cls.id.toString()} key={cls.id}>{cls.name}</option>
            ))}
          </select>
          {errors.classId?.message && <p className="text-xs text-red-400">{errors.classId.message?.toString()}</p>}
        </div>
      </div>
      
      <Button type="submit" className="w-full" disabled={isLoading || (!uploadedFile && type === 'create')}>
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {isLoading ? "Publication..." : (type === "create" ? "Publier l'Annonce" : "Mettre à jour l'Annonce")}
      </Button>
    </form>
  );
};

export default AnnouncementForm;
