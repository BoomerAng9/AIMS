import { useAppDispatch, useAppSelector } from '@/state/store'
import { useState } from 'react'
import { toast } from 'sonner'

import { PROVIDERS_NAME } from '@/constants/models'
import {
    selectAvailableModels,
    selectSelectedModel,
    setSelectedModel,
    setAvailableModels
} from '@/state'
import { IModel } from '@/typings/settings'
import { settingsService } from '@/services/settings.service'
import { Button } from '../ui/button'
import { Icon } from '../ui/icon'
import AddEditModel from './add-edit-model'

interface ModelSettingProps {
    className?: string
}

const ModelSetting = ({ className }: ModelSettingProps) => {
    const dispatch = useAppDispatch()

    const [isAddEditModelOpen, setIsAddEditModelOpen] = useState(false)
    const [editingModel, setEditingModel] = useState<IModel | null>(null)

    const availableModels = useAppSelector(selectAvailableModels)
    const selectedModel = useAppSelector(selectSelectedModel)

    const fetchAvailableModels = async () => {
        try {
            const data = await settingsService.getAvailableModels()
            dispatch(setAvailableModels(data?.models || []))
        } catch (error) {
            console.error('Failed to fetch available models:', error)
        }
    }

    const saveConfig = async (model: IModel, isEdit: boolean) => {
        dispatch(setSelectedModel(model.id))
        await fetchAvailableModels()
        setIsAddEditModelOpen(false)
        toast.success(
            isEdit ? 'Model updated successfully' : 'Model created successfully'
        )
    }

    const handleDelete = async (modelToDelete: string) => {
        try {
            // Call the delete API with the model ID
            await settingsService.deleteModel(modelToDelete)

            // Refetch the models list
            await fetchAvailableModels()

            // If the deleted model was selected, select the first available model
            if (selectedModel === modelToDelete) {
                const remainingModels = availableModels.filter(
                    (m) => m.id !== modelToDelete
                )
                if (remainingModels.length > 0) {
                    dispatch(setSelectedModel(remainingModels[0].id))
                } else {
                    dispatch(setSelectedModel(undefined))
                }
            }

            toast.success('Model deleted successfully')
        } catch (error) {
            console.error('Error deleting model:', error)
            toast.error('Failed to delete model. Please try again.')
        }
    }

    const handleEdit = (model: IModel) => {
        setEditingModel(model)
        setIsAddEditModelOpen(true)
    }

    const handleCloseAddEdit = () => {
        setIsAddEditModelOpen(false)
        setEditingModel(null)
    }

    return (
        <div className={`space-y-4 ${className}`}>
            <p className="text-lg font-semibold dark:text-white">
                LLM Model Configuration
            </p>
            {availableModels?.map((model) => {
                const isActive = selectedModel === model?.id

                return (
                    <div
                        key={model?.id}
                        className={`h-[77px] cursor-pointer flex items-center justify-between rounded-2xl ${isActive ? 'border-2 border-firefly dark:border-sky-blue-2 bg-sky-blue dark:bg-sky-blue-2/20 p-[14px]' : 'bg-firefly/10 dark:bg-sky-blue-2/5 p-4'}`}
                        onClick={() => {
                            dispatch(setSelectedModel(model?.id))
                        }}
                    >
                        <div className="flex items-center gap-x-4">
                            <div
                                className={`rounded-full size-[46px] flex items-center justify-center`}
                            >
                                {PROVIDERS_NAME[model?.api_type] && (
                                    <img
                                        src={`/images/${model?.api_type}.svg`}
                                        alt={model?.api_type}
                                        className="size-[46px] object-contain"
                                    />
                                )}
                            </div>
                            <div>
                                <p className="text-base font-semibold dark:text-white">
                                    {PROVIDERS_NAME[model?.api_type]}
                                </p>
                                <p className="mt-1 dark:text-white text-sm">
                                    {model?.model}
                                </p>
                            </div>
                        </div>
                        {model?.source !== 'system' && (
                            <div className="flex items-center gap-x-4">
                                <Button
                                    className="p-0 size-6"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleEdit(model)
                                    }}
                                >
                                    <Icon
                                        name="edit-2"
                                        className="fill-firefly dark:fill-sky-blue-2 size-6"
                                    />
                                </Button>
                                <Button
                                    className="p-0 size-6"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleDelete(model?.id)
                                    }}
                                >
                                    <Icon name="trash" />
                                </Button>
                            </div>
                        )}
                    </div>
                )
            })}
            <Button
                variant="outline"
                className="text-black dark:text-white rounded-xl px-6 font-normal"
                onClick={() => setIsAddEditModelOpen(true)}
            >
                <Icon
                    name="add-square"
                    className="fill-black dark:fill-white"
                />{' '}
                New Model
            </Button>
            <AddEditModel
                open={isAddEditModelOpen}
                onOpenChange={handleCloseAddEdit}
                onSaveConfig={saveConfig}
                editingModel={editingModel}
            />
        </div>
    )
}

export default ModelSetting
