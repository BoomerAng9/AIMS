import clsx from 'clsx'
import { useMemo } from 'react'

import {
    selectBuildStep,
    selectIsCompleted,
    setActiveTab,
    setSelectedBuildStep,
    useAppDispatch,
    useAppSelector
} from '@/state'
import { BUILD_STEP, TAB } from '@/typings/agent'
import { Icon } from '../ui/icon'

const AgentSteps = () => {
    const dispatch = useAppDispatch()
    const buildStep = useAppSelector(selectBuildStep)
    const isCompleted = useAppSelector(selectIsCompleted)

    const isActiveBuildStep = useMemo(() => {
        return buildStep === BUILD_STEP.BUILD || isCompleted
    }, [buildStep])

    const isActiveResultStep = useMemo(() => {
        return isCompleted
    }, [isCompleted])

    return (
        <div className="flex items-center justify-center gap-x-3">
            <div
                className="flex items-center gap-x-2 cursor-pointer"
                onClick={() => dispatch(setSelectedBuildStep(BUILD_STEP.PLAN))}
            >
                <div
                    className={clsx(
                        'flex items-center justify-center size-7 rounded-full bg-firefly/30 dark:bg-sky-blue/30'
                    )}
                >
                    <Icon
                        name="brain"
                        className={clsx({
                            ' stroke-black dark:stroke-sky-blue': true
                        })}
                    />
                </div>
                <p
                    className={clsx('text-base', {
                        'font-semibold dark:text-white': true
                    })}
                >
                    Plan
                </p>
            </div>
            <Icon
                name="line"
                className="w-6 md:w-12 stroke-black dark:stroke-white"
            />
            <div
                className={clsx('flex items-center gap-x-2', {
                    'cursor-pointer': isActiveBuildStep
                })}
                onClick={() => {
                    if (!isActiveBuildStep) return
                    dispatch(setSelectedBuildStep(BUILD_STEP.BUILD))
                }}
            >
                <div
                    className={clsx(
                        'flex items-center justify-center size-7 rounded-full',
                        {
                            'bg-firefly/30 dark:bg-sky-blue/30':
                                isActiveBuildStep,
                            'border border-black/[0.58] dark:border-white/[0.58]':
                                !isActiveBuildStep
                        }
                    )}
                >
                    <Icon
                        name="wrench"
                        className={clsx({
                            ' stroke-black dark:stroke-sky-blue':
                                isActiveBuildStep,
                            'stroke-black/[0.58] dark:stroke-white/[0.58]':
                                !isActiveBuildStep
                        })}
                    />
                </div>
                <p
                    className={clsx('text-base', {
                        'font-semibold dark:text-white': isActiveBuildStep,
                        'text-black/[0.58] dark:text-white/[0.58]':
                            !isActiveBuildStep
                    })}
                >
                    Build
                </p>
            </div>
            <Icon
                name="line"
                className="w-6 md:w-12 stroke-black dark:stroke-white"
            />
            <div
                className={clsx('flex items-center gap-x-2', {
                    'cursor-pointer': isActiveResultStep
                })}
                onClick={() => {
                    if (!isActiveResultStep) return
                    dispatch(setActiveTab(TAB.RESULT))
                }}
            >
                <div
                    className={clsx(
                        'flex items-center justify-center size-7 rounded-full',
                        {
                            'bg-firefly/30 dark:bg-sky-blue/30':
                                isActiveResultStep,
                            'border border-black/[0.58] dark:border-white/[0.58]':
                                !isActiveResultStep
                        }
                    )}
                >
                    <Icon
                        name="ai-magic"
                        className={clsx({
                            ' stroke-black dark:stroke-sky-blue':
                                isActiveResultStep,
                            'stroke-black/[0.58] dark:stroke-white/[0.58]':
                                !isActiveResultStep
                        })}
                    />
                </div>
                <p
                    className={clsx('text-base', {
                        'font-semibold dark:text-white': isActiveResultStep,
                        'text-black/[0.58] dark:text-white/[0.58]':
                            !isActiveResultStep
                    })}
                >
                    Result
                </p>
            </div>
        </div>
    )
}

export default AgentSteps
