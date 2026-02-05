import { useMemo, useEffect, useState } from 'react'

import { Button } from '../ui/button'
import { Icon } from '../ui/icon'
import {
    selectMessages,
    useAppSelector,
    useAppDispatch,
    selectCurrentBuildStep,
    setCurrentBuildStep,
    setCurrentActionData,
    selectRequestedAction
} from '@/state'
import { Slider } from '../ui/slider'
import { TOOL } from '@/typings'
import { findIndex } from 'lodash'

const AgentController = () => {
    const dispatch = useAppDispatch()
    const messages = useAppSelector(selectMessages)
    const currentBuildStep = useAppSelector(selectCurrentBuildStep)
    const requestedAction = useAppSelector(selectRequestedAction)

    const [isLiveUpdate, setIsLiveUpdate] = useState(true)

    const actions = useMemo(
        () =>
            messages?.filter(
                (m) =>
                    m.action &&
                    m?.action?.type !== TOOL.TODO_WRITE &&
                    m?.action?.type !== TOOL.TODO_READ &&
                    m?.action?.type !== TOOL.COMPLETE &&
                    m?.action?.type !== TOOL.FULLSTACK_PROJECT_INIT
            ),
        [messages]
    )

    const totalBuildSteps = useMemo(() => actions?.length || 0, [actions])

    const step = useMemo(
        () => (currentBuildStep > 0 ? currentBuildStep : totalBuildSteps),
        [currentBuildStep, totalBuildSteps]
    )

    // Auto-update to latest step when new messages are added
    useEffect(() => {
        if (isLiveUpdate && totalBuildSteps > 0) {
            dispatch(setCurrentBuildStep(totalBuildSteps))
        }
    }, [totalBuildSteps, isLiveUpdate, dispatch])

    // Sync currentActionData when step changes
    useEffect(() => {
        if (step > 0 && step <= totalBuildSteps && actions) {
            const actionData = actions[step - 1]?.action
            dispatch(setCurrentActionData(actionData))
        }
    }, [step, totalBuildSteps, actions, dispatch])

    useEffect(() => {
        if (requestedAction) {
            const index = findIndex(
                actions,
                (m) =>
                    m?.action?.data?.tool_call_id ===
                    requestedAction?.data?.tool_call_id
            )
            if (index >= 0) {
                dispatch(setCurrentBuildStep(index + 1))
            }
        }
    }, [requestedAction])

    return (
        <div className="flex items-baseline justify-between gap-4 mt-3">
            <div className="flex-1">
                <div className="flex gap-x-[6px] items-center mb-[6px]">
                    <button
                        className={`cursor-pointer disabled:opacity-30`}
                        disabled={step === 1}
                        onClick={() => {
                            dispatch(setCurrentBuildStep(step - 1))
                            setIsLiveUpdate(false)
                        }}
                    >
                        <Icon
                            name="arrow-left-2"
                            className="size-4 fill-black dark:fill-white"
                        />
                    </button>
                    <div className="flex gap-x-[2px] text-xs">
                        <span>{step}</span>
                        <span>/</span>
                        <span>{totalBuildSteps}</span>
                    </div>
                    <button
                        className={`cursor-pointer disabled:opacity-30`}
                        disabled={step === totalBuildSteps}
                        onClick={() => dispatch(setCurrentBuildStep(step + 1))}
                    >
                        <Icon
                            name="arrow-right-2"
                            className="size-4 fill-black dark:fill-white"
                        />
                    </button>
                </div>
                <Slider
                    value={[step]}
                    onValueChange={(e) => {
                        const step = e[0]
                        if (step < currentBuildStep) {
                            setIsLiveUpdate(false)
                        }
                        dispatch(setCurrentBuildStep(step))
                    }}
                    max={totalBuildSteps}
                    step={1}
                />
            </div>
            {step === totalBuildSteps ? (
                <div
                    className={`flex items-center bg-firefly text-sky-blue-2 dark:bg-sky-blue-2 dark:text-black h-6 px-3 text-xs font-semibold rounded-3xl`}
                >
                    Live Update
                </div>
            ) : (
                <Button
                    className={`dark:text-sky-blue-2 border dark:border-sky-blue-2 h-6 text-xs font-semibold rounded-3xl`}
                    onClick={() => {
                        dispatch(setCurrentBuildStep(totalBuildSteps))
                        setIsLiveUpdate(true)
                    }}
                >
                    Jump to latest
                </Button>
            )}
        </div>
    )
}

export default AgentController
