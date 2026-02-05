import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import dayjs from 'dayjs'

import { PROVIDERS_NAME } from '@/constants/models'
import { useAppSelector } from '@/state/store'
import { ISetting } from '@/typings/agent'
import { Button } from '../ui/button'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from '../ui/form'
import { Icon } from '../ui/icon'
import { Input } from '../ui/input'
import { Sheet, SheetClose, SheetContent, SheetHeader } from '../ui/sheet'

interface MediaSettingProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSaveConfig: (data: ISetting) => void
    editingModelKey?: string | null
}

const FormSchema = z.object({
    gcp_project_id: z.string().optional(),
    gcp_location: z.string().optional(),
    gcs_output_bucket: z.string().optional(),
    google_ai_studio_api_key: z.string().optional()
})

const MediaSetting = ({
    open,
    onOpenChange,
    onSaveConfig
}: MediaSettingProps) => {
    const [selectedProvider, setSelectedProvider] = useState('vertex')

    const isSavingSetting = useAppSelector(
        (state) => state.settings.isSavingSetting
    )
    const currentSettingData = useAppSelector(
        (state) => state.settings.currentSettingData
    )

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            gcp_project_id: '',
            gcp_location: '',
            gcs_output_bucket: '',
            google_ai_studio_api_key: ''
        }
    })

    // Fill form data when editing
    useEffect(() => {
        const config = currentSettingData?.media_config
        if (config) {
            const provider = config.gcp_project_id ? 'vertex' : 'gemini'
            setSelectedProvider(provider)

            // Set form values
            form.setValue('gcp_project_id', config.gcp_project_id || '')
            form.setValue('gcp_location', config.gcp_location || '')
            form.setValue('gcs_output_bucket', config.gcs_output_bucket || '')
            form.setValue(
                'google_ai_studio_api_key',
                config.google_ai_studio_api_key || ''
            )
        }
    }, [currentSettingData, form])

    const handleProviderChange = (provider: string) => {
        setSelectedProvider(provider)
        if (provider === 'gemini') {
            form.reset({
                ...(currentSettingData?.media_config || {}),
                gcp_project_id: '',
                gcp_location: '',
                gcs_output_bucket: '',
                google_ai_studio_api_key: undefined
            })
        } else {
            form.reset({
                ...(currentSettingData?.media_config || {}),
                gcp_project_id:
                    currentSettingData?.media_config?.gcp_project_id || '',
                gcp_location:
                    currentSettingData?.media_config?.gcp_location || '',
                gcs_output_bucket:
                    currentSettingData?.media_config?.gcs_output_bucket || '',
                google_ai_studio_api_key: ''
            })
        }
    }

    const onSubmit = (data: z.infer<typeof FormSchema>) => {
        onSaveConfig({
            ...(currentSettingData || {}),
            media_config: data
        })
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="pt-3 md:pt-12 w-full !max-w-[480px]">
                <SheetHeader className="px-6 pt-0 gap-1 pb-4">
                    <div className="flex items-center justify-between">
                        <p className="text-2xl font-semibold">Media Settings</p>
                        <div className="flex items-center gap-x-4">
                            <SheetClose className="cursor-pointer">
                                <Icon
                                    name="arrow-right"
                                    className="dark:inline hidden"
                                />
                                <Icon
                                    name="arrow-right-dark"
                                    className="dark:hidden inline"
                                />
                            </SheetClose>
                        </div>
                    </div>
                    <p className="text-sm dark:text-white/[0.56]">
                        Configure your media provider and API settings.
                    </p>
                </SheetHeader>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-6 px-3 md:px-6 overflow-auto pb-4 md:pb-12"
                    >
                        <div className="space-y-4">
                            <p className="text-lg font-semibold dark:text-white">
                                Media Provider
                            </p>
                            <div className="grid grid-cols-3 gap-4">
                                {['gemini', 'vertex'].map((provider) => (
                                    <div
                                        key={provider}
                                        className={`h-[120px] flex items-center flex-col gap-4 rounded-2xl cursor-pointer ${
                                            selectedProvider === provider
                                                ? 'border-2 border-sky-blue-2 bg-sky-blue-2/20 p-[14px] font-semibold'
                                                : 'bg-sky-blue-2/5 p-4'
                                        }`}
                                        onClick={() => {
                                            handleProviderChange(provider)
                                        }}
                                    >
                                        <img
                                            src={`/images/${provider}.svg`}
                                            alt={provider}
                                            className="w-auto h-[53px]"
                                        />
                                        <p className="text-sm dark:text-white">
                                            {PROVIDERS_NAME[provider]}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {selectedProvider === 'gemini' && (
                            <FormField
                                control={form.control}
                                name="google_ai_studio_api_key"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-lg">
                                            API Key
                                        </FormLabel>
                                        <FormControl>
                                            <div className="space-y-2 relative">
                                                <Icon
                                                    name="key-square"
                                                    className={`absolute top-3 left-4 ${field.value ? '' : 'opacity-30'}`}
                                                />
                                                <Input
                                                    id="api-key"
                                                    className="pl-[56px]"
                                                    type="password"
                                                    placeholder="Enter your API Key"
                                                    {...field}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage className="mt-1 pl-4">
                                            <div className="flex gap-x-2 items-center">
                                                <span className="font-semibold text-sm italic">
                                                    Latest update
                                                </span>
                                                <span>
                                                    {dayjs().format(
                                                        'DD/MM/YYYY -- HH:mm:ss'
                                                    )}
                                                </span>
                                            </div>
                                        </FormMessage>
                                    </FormItem>
                                )}
                            />
                        )}
                        {selectedProvider === 'vertex' && (
                            <>
                                <FormField
                                    control={form.control}
                                    name="gcp_project_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-lg">
                                                Vertex Project ID
                                            </FormLabel>
                                            <FormControl>
                                                <div className="space-y-2 relative">
                                                    <Icon
                                                        name="folder-2"
                                                        className={`absolute top-3 left-4 ${field.value ? '' : 'opacity-30'}`}
                                                    />
                                                    <Input
                                                        id="vertex-project-id"
                                                        className="pl-[56px]"
                                                        type="text"
                                                        placeholder="Enter your Vertex Project ID"
                                                        {...field}
                                                    />
                                                </div>
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="gcs_output_bucket"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-lg">
                                                GCS Output Bucket
                                            </FormLabel>
                                            <FormControl>
                                                <div className="space-y-2 relative">
                                                    <Icon
                                                        name="folder-2"
                                                        className={`absolute top-3 left-4 ${field.value ? '' : 'opacity-30'}`}
                                                    />
                                                    <Input
                                                        id="gcs-output-bucket"
                                                        className="pl-[56px]"
                                                        type="text"
                                                        placeholder="Enter your GCS Output Bucket"
                                                        {...field}
                                                    />
                                                </div>
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="gcp_location"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-lg">
                                                Vertex Region
                                            </FormLabel>
                                            <FormControl>
                                                <div className="space-y-2 relative">
                                                    <Icon
                                                        name="global"
                                                        className={`absolute top-3 left-4 fill-white ${field.value ? '' : 'opacity-30'}`}
                                                    />
                                                    <Input
                                                        id="vertex-region"
                                                        className="pl-[56px]"
                                                        type="text"
                                                        placeholder="Enter your Vertex Region"
                                                        {...field}
                                                    />
                                                </div>
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </>
                        )}

                        <div className="grid grid-cols-2 gap-4 mt-12">
                            <Button
                                type="reset"
                                variant="outline"
                                className="col-span-1 h-12 rounded-xl text-base"
                                onClick={() => onOpenChange(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="col-span-1 h-12 rounded-xl bg-sky-blue text-black text-base"
                            >
                                {isSavingSetting && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Save
                            </Button>
                        </div>
                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    )
}

export default MediaSetting
