
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { Textarea } from "@/components/ui/textarea";
import { announcementSchema, type AnnouncementSchema } from "@/lib/formValidationSchemas";
import { useCreateAnnouncementMutation, useUpdateAnnouncementMutation } from "@/lib/redux/api/entityApi";
import type { Dispatch, SetStateAction } from "react";
import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import type { Announcement, Class } from "@/types/index"; // Using types from @/types for Prisma models

// Define specific types for related data
type RelatedClass = Pick<Class, 'id' | 'name'>;

// Type for the 'data' prop when updating
// This should align with how data is fetched (e.g., Prisma Announcement type)
type UpdateAnnouncementData = Announcement;


const AnnouncementForm = ({
  type,
  data, // data is Prisma.Announcement
  setOpen,
  relatedData,
}: {
  type: "create" | "update";
  data?: UpdateAnnouncementData;
  setOpen: Dispatch<SetStateAction<boolean>>;
  relatedData?: { classes: RelatedClass[] };
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AnnouncementSchema>({
    resolver: zodResolver(announcementSchema),
    defaultValues: data ? {
      ...data,
      date: data.date ? new Date(data.date) : undefined,
      classId: data.classId,
    } : {
      // Default for create form
      title: "",
      description: "",
      date: undefined,
      classId: null, // Use null for optional number type in schema
    },
  });

  const router = useRouter();
  const [createAnnouncement, { isLoading: isCreating, isSuccess: createSuccess, isError: createIsError, error: createErrorData }] = useCreateAnnouncementMutation();
  const [updateAnnouncement, { isLoading: isUpdating, isSuccess: updateSuccess, isError: updateIsError, error: updateErrorData }] = useUpdateAnnouncementMutation();

  const isLoading = isCreating || isUpdating;

  // formData is AnnouncementSchema (where classId is number | null after Zod transform)
  const onSubmit = handleSubmit(async (formData: AnnouncementSchema) => {
    try {
      if (type === "create") {
        // `formData` is already validated and transformed by Zod
        await createAnnouncement(formData).unwrap();
      } else if (data?.id) {
        // Ensure date is a Date object if it's defined
        await updateAnnouncement({
          ...formData, id: data.id,

        }).unwrap();
      }
    } catch (err) {
      // Error handled by useEffect
    }
  });

 useEffect(() => {
    if (createSuccess || updateSuccess) {
      toast({ title: `Annonce ${type === "create" ? "créée" : "mise à jour"} avec succès !` });
      setOpen(false);
      reset();
      router.refresh();
    }
  }, [createSuccess, updateSuccess, type, setOpen, reset, router]);

  useEffect(() => {
    const error = createErrorData || updateErrorData;
    if (error && Object.keys(error).length > 0) {
      const errorMessage = (error as any)?.data?.message || "Une erreur inattendue s'est produite.";
      toast({ variant: "destructive", title: "Échec de l'opération", description: errorMessage });
    }
  }, [createIsError, updateIsError, createErrorData, updateErrorData, toast]);

  const classes = relatedData?.classes || [];

  return (
    <form className="flex flex-col gap-8" onSubmit={onSubmit}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Créer une Nouvelle Annonce" : "Mettre à jour l'Annonce"}
      </h1>

      <div className="flex flex-col gap-4">
        <InputField
          label="Titre de l'Annonce"
          name="title"
          register={register}
          error={errors?.title}
          inputProps={{disabled: isLoading, className: "md:w-full"}}
        />
        <div className="flex flex-col gap-2 w-full">
          <label htmlFor="description" className="text-xs text-gray-500">Description</label>
          <Textarea
            id="description"
            {...register("description")}
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full disabled:opacity-50"
            disabled={isLoading}
          />
          {errors.description?.message && (
            <p className="text-xs text-red-400">{errors.description.message.toString()}</p>
          )}
        </div>
      </div>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Date"
          name="date"
          type="date"
          register={register}
          error={errors?.date}
          inputProps={{disabled: isLoading}}
        />
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Classe (Optionnel)</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full disabled:opacity-50"
            {...register("classId")} // This registers a string field with react-hook-form
            disabled={isLoading}
            // defaultValue for HTML select should be a string
            defaultValue={data?.classId?.toString() ?? ""}
          >
            <option value="">Toutes les classes</option>
            {classes.map((cls: RelatedClass) => (
              <option value={cls.id.toString()} key={cls.id}> {/* Ensure option value is string */}
                {cls.name}
              </option>
            ))}
          </select>
          {errors.classId?.message && (
            <p className="text-xs text-red-400">
              {errors.classId.message?.toString()}
            </p>
          )}
        </div>
      </div>
       {(createIsError || updateIsError) && (
        <span className="text-red-500 text-sm">
           {(createErrorData as any)?.data?.message || (updateErrorData as any)?.data?.message || "Une erreur s'est produite."}
        </span>
      )}
      <button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90 p-2 rounded-md" disabled={isLoading}>
        {isLoading ? "Traitement en cours..." : (type === "create" ? "Créer l'Annonce" : "Mettre à jour l'Annonce")}
      </button>
    </form>
  );
};

export default AnnouncementForm;
