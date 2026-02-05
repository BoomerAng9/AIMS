import {
    type ComponentType,
    type CSSProperties,
    type SVGProps,
    useEffect,
    useState
} from 'react'

interface IconProps {
    name: string
    className?: string
    color?: string
    style?: CSSProperties
}

const icons = import.meta.glob<{
    default: ComponentType<SVGProps<SVGSVGElement>>
}>('@/assets/icons/*.svg', {
    query: '?react',
    eager: false
})

export function Icon({ name, className = 'size-6', color, style }: IconProps) {
    const [SvgComponent, setSvgComponent] = useState<ComponentType<
        SVGProps<SVGSVGElement>
    > | null>(null)

    useEffect(() => {
        if (name === 'claude') {
            setSvgComponent(null)
            return
        }

        const iconPath = `/src/assets/icons/${name}.svg`
        const iconLoader = icons[iconPath]

        if (!iconLoader) {
            console.error(`Icon not found: ${name}`)
            setSvgComponent(null)
            return
        }

        iconLoader()
            .then((module) => {
                setSvgComponent(() => module.default)
            })
            .catch((error) => {
                console.error(`Failed to load icon: ${name}`, error)
                setSvgComponent(null)
            })
    }, [name])

    if (name === 'claude') {
        return (
            <img
                src={`/images/claude.png`}
                className={className}
                style={style}
            />
        )
    }

    if (!SvgComponent) {
        return null
    }

    return <SvgComponent className={className} color={color} style={style} />
}
