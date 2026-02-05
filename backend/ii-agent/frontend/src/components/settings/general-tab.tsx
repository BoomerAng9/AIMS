import { useTheme } from 'next-themes'

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '../ui/select'
import { Icon } from '../ui/icon'
import { useState } from 'react'

const GeneralTab = () => {
    const { theme, setTheme } = useTheme()
    const [language, setLanguage] = useState('en')

    return (
        <div className="divide-y divide-white/30">
            <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between pb-6">
                <div>
                    <h2 className="text-[18px] font-semibold mb-1">Theme</h2>
                    <p className="text-xs max-w-[332px]">
                        Get notified when ACHEEVY responds to requests that
                        take time, like research or image generation.
                    </p>
                </div>
                <Select
                    onValueChange={(value) => {
                        setTheme(value)
                    }}
                    value={theme}
                >
                    <SelectTrigger className="**:fill-black **:dark:fill-white w-[229px]">
                        <div className="flex items-center gap-4">
                            <SelectValue placeholder="Select Theme" />
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={'system'}>
                            <div className="flex items-center gap-4">
                                <Icon
                                    name="cpu"
                                    className={`size-6 fill-black`}
                                />
                                System
                            </div>
                        </SelectItem>
                        <SelectItem value={'dark'}>
                            <div className="flex items-center gap-4">
                                <Icon
                                    name="moon"
                                    className={`size-6 fill-black`}
                                />
                                Dark
                            </div>
                        </SelectItem>
                        <SelectItem value={'light'}>
                            <div className="flex items-center gap-4">
                                <Icon
                                    name="sun"
                                    className={`size-6 fill-black`}
                                />
                                Light
                            </div>
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-6">
                <div>
                    <h2 className="text-[18px] font-semibold mb-1">Language</h2>
                    <p className="text-xs max-w-[332px]">
                        Get notified when ACHEEVY responds to requests that
                        take time, like research or image generation.
                    </p>
                </div>
                <Select
                    onValueChange={(value) => {
                        setLanguage(value)
                    }}
                    value={language}
                >
                    <SelectTrigger className="**:fill-black **:dark:fill-white w-[229px]">
                        <div className="flex items-center gap-4">
                            <SelectValue placeholder="Select Language" />
                        </div>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value={'en'}>
                            <div className="flex items-center gap-4">
                                <Icon
                                    name="cpu"
                                    className={`size-6 fill-black`}
                                />
                                English (US)
                            </div>
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    )
}

export default GeneralTab
