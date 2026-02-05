import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { settingsService } from '@/services/settings.service'
import { IMcpSettings, UpdateMcpSettingsPayload } from '@/typings/settings'
import { Button } from '../ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel } from '../ui/form'
import { Icon } from '../ui/icon'
import { Sheet, SheetClose, SheetContent, SheetHeader } from '../ui/sheet'
import { Textarea } from '../ui/textarea'

const FormSchema = z.object({
    tool_config: z.string()
})

interface ConnectToolMCPProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    editingMcp?: IMcpSettings | null
}

const ConnectToolMCP = ({
    open,
    onOpenChange,
    editingMcp
}: ConnectToolMCPProps) => {
    const [isLoading, setIsLoading] = useState(false)

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: {
            tool_config: ''
        }
    })

    const onSubmit = async (data: z.infer<typeof FormSchema>) => {
        if (!data.tool_config) {
            toast.error('Please enter MCP configuration')
            return
        }

        try {
            setIsLoading(true)
            const mcp_config = JSON.parse(data.tool_config)

            const mcpSetting: UpdateMcpSettingsPayload = {
                mcp_config
            }

            if (editingMcp) {
                await settingsService.updateMcpSettings(
                    editingMcp.id,
                    mcpSetting
                )
                toast.success('MCP settings updated successfully')
            } else {
                await settingsService.createMcpSettings(mcpSetting)
                toast.success('MCP tool connected successfully')
            }

            onOpenChange(false)
            form.reset()
        } catch (error) {
            if (error instanceof SyntaxError) {
                toast.error('Invalid JSON format')
            } else {
                toast.error('Failed to save MCP settings')
                console.error('Error saving MCP settings:', error)
            }
        } finally {
            setIsLoading(false)
        }
    }

    const handleCancel = () => {
        onOpenChange(false)
    }

    useEffect(() => {
        if (editingMcp) {
            form.setValue(
                'tool_config',
                JSON.stringify(editingMcp.mcp_config, null, 2)
            )
        }
    }, [editingMcp])

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="px-3 md:px-6 py-3 md:py-12 w-full !max-w-[560px]">
                <SheetHeader className="p-0 gap-6 pb-4">
                    <div className="flex items-center justify-between">
                        <p className="text-2xl font-semibold">
                            {editingMcp ? 'Edit MCP Tool' : 'Connect new tool'}
                        </p>
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
                </SheetHeader>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-6 overflow-auto pb-4 md:pb-12"
                    >
                        <FormField
                            control={form.control}
                            name="tool_config"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-lg">
                                        MCP Connect JSON
                                    </FormLabel>
                                    <FormControl>
                                        <div className="space-y-2 relative">
                                            <Icon
                                                name="key-square"
                                                className={`absolute top-3 left-4 fill-black dark:fill-white ${field.value ? '' : 'opacity-30'}`}
                                            />
                                            <Textarea
                                                id="tool-config"
                                                className="pl-[56px] min-h-[144px] mb-4"
                                                placeholder="Enter MCP Connect JSON"
                                                {...field}
                                            />
                                        </div>
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <div className="space-y-4 grid grid-cols-2 gap-4">
                            <Button
                                type="button"
                                variant="outline"
                                className="h-12 rounded-xl text-base"
                                onClick={handleCancel}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="h-12 rounded-xl bg-sky-blue text-black text-base"
                                disabled={isLoading}
                            >
                                {isLoading
                                    ? 'Saving...'
                                    : editingMcp
                                      ? 'Update'
                                      : 'Connect'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    )
}

export default ConnectToolMCP
