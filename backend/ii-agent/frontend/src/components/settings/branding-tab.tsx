/**
 * M.I.M. (Make It Mine) Branding Tab Component
 * 
 * Allows users to customize the ACHEEVY branding:
 * - App name and tagline
 * - Color scheme (primary, secondary, accent, background, text)
 * - Logo upload
 * - Live preview
 */

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import axiosInstance from '@/lib/axios'

interface BrandingSettings {
    id: string
    user_id: string | null
    app_name: string
    tagline: string | null
    primary_color: string
    secondary_color: string
    accent_color: string
    background_color: string
    text_color: string
    logo_url: string | null
    logo_dark_url: string | null
    favicon_url: string | null
    custom_css: string | null
    show_powered_by: boolean
    custom_footer_text: string | null
}

const defaultBranding: BrandingSettings = {
    id: 'default',
    user_id: null,
    app_name: 'ACHEEVY',
    tagline: 'Your AI-Powered Achievement Partner',
    primary_color: '#f59e0b',
    secondary_color: '#fbbf24',
    accent_color: '#d97706',
    background_color: '#0f172a',
    text_color: '#f8fafc',
    logo_url: null,
    logo_dark_url: null,
    favicon_url: null,
    custom_css: null,
    show_powered_by: true,
    custom_footer_text: null,
}

const ColorPicker = ({ 
    label, 
    value, 
    onChange, 
    description 
}: { 
    label: string
    value: string
    onChange: (color: string) => void
    description?: string
}) => {
    return (
        <div className="space-y-2">
            <Label className="text-sm font-medium">{label}</Label>
            <div className="flex items-center gap-3">
                <div className="relative">
                    <input
                        type="color"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-12 h-10 rounded-lg cursor-pointer border border-gray-600"
                    />
                </div>
                <Input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-28 font-mono text-sm"
                    placeholder="#000000"
                    pattern="^#[0-9A-Fa-f]{6}$"
                />
            </div>
            {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
            )}
        </div>
    )
}

const BrandingTab = () => {
    const [branding, setBranding] = useState<BrandingSettings>(defaultBranding)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [hasChanges, setHasChanges] = useState(false)
    const [originalBranding, setOriginalBranding] = useState<BrandingSettings>(defaultBranding)

    // Fetch current branding settings
    const fetchBranding = useCallback(async () => {
        try {
            setIsLoading(true)
            const response = await axiosInstance.get('/branding')
            setBranding(response.data)
            setOriginalBranding(response.data)
        } catch (error) {
            console.error('Failed to fetch branding:', error)
            toast.error('Failed to load branding settings')
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchBranding()
    }, [fetchBranding])

    // Track changes
    useEffect(() => {
        const changed = JSON.stringify(branding) !== JSON.stringify(originalBranding)
        setHasChanges(changed)
    }, [branding, originalBranding])

    // Apply CSS variables for live preview
    useEffect(() => {
        const root = document.documentElement
        root.style.setProperty('--mim-primary', branding.primary_color)
        root.style.setProperty('--mim-secondary', branding.secondary_color)
        root.style.setProperty('--mim-accent', branding.accent_color)
        root.style.setProperty('--mim-background', branding.background_color)
        root.style.setProperty('--mim-text', branding.text_color)
    }, [branding])

    const updateField = <K extends keyof BrandingSettings>(
        field: K, 
        value: BrandingSettings[K]
    ) => {
        setBranding(prev => ({ ...prev, [field]: value }))
    }

    const handleSave = async () => {
        try {
            setIsSaving(true)
            const response = await axiosInstance.put('/branding', {
                app_name: branding.app_name,
                tagline: branding.tagline,
                primary_color: branding.primary_color,
                secondary_color: branding.secondary_color,
                accent_color: branding.accent_color,
                background_color: branding.background_color,
                text_color: branding.text_color,
                show_powered_by: branding.show_powered_by,
                custom_footer_text: branding.custom_footer_text,
            })
            setBranding(response.data)
            setOriginalBranding(response.data)
            toast.success('Branding settings saved!')
        } catch (error) {
            console.error('Failed to save branding:', error)
            toast.error('Failed to save branding settings')
        } finally {
            setIsSaving(false)
        }
    }

    const handleReset = async () => {
        try {
            setIsSaving(true)
            const response = await axiosInstance.post('/branding/reset')
            setBranding(response.data)
            setOriginalBranding(response.data)
            toast.success('Branding reset to defaults')
        } catch (error) {
            console.error('Failed to reset branding:', error)
            toast.error('Failed to reset branding')
        } finally {
            setIsSaving(false)
        }
    }

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, darkMode: boolean = false) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']
        if (!allowedTypes.includes(file.type)) {
            toast.error('Invalid file type. Please upload PNG, JPG, SVG, or WebP')
            return
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('File too large. Maximum size is 5MB')
            return
        }

        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('dark_mode', String(darkMode))

            const response = await axiosInstance.post('/branding/logo', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            setBranding(response.data)
            setOriginalBranding(response.data)
            toast.success('Logo uploaded successfully!')
        } catch (error) {
            console.error('Failed to upload logo:', error)
            toast.error('Failed to upload logo')
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h2 className="text-xl font-semibold text-foreground">
                    Make It Mine (M.I.M.)
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Customize the look and feel of your ACHEEVY experience
                </p>
            </div>

            {/* App Identity */}
            <section className="space-y-4">
                <h3 className="text-lg font-medium border-b border-border pb-2">
                    App Identity
                </h3>
                
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="app_name">App Name</Label>
                        <Input
                            id="app_name"
                            value={branding.app_name}
                            onChange={(e) => updateField('app_name', e.target.value)}
                            placeholder="ACHEEVY"
                            maxLength={100}
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="tagline">Tagline</Label>
                        <Input
                            id="tagline"
                            value={branding.tagline || ''}
                            onChange={(e) => updateField('tagline', e.target.value)}
                            placeholder="Your AI-Powered Achievement Partner"
                            maxLength={200}
                        />
                    </div>
                </div>
            </section>

            {/* Color Scheme */}
            <section className="space-y-4">
                <h3 className="text-lg font-medium border-b border-border pb-2">
                    Color Scheme
                </h3>
                
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <ColorPicker
                        label="Primary Color"
                        value={branding.primary_color}
                        onChange={(c) => updateField('primary_color', c)}
                        description="Main brand color (buttons, links)"
                    />
                    
                    <ColorPicker
                        label="Secondary Color"
                        value={branding.secondary_color}
                        onChange={(c) => updateField('secondary_color', c)}
                        description="Complementary accent color"
                    />
                    
                    <ColorPicker
                        label="Accent Color"
                        value={branding.accent_color}
                        onChange={(c) => updateField('accent_color', c)}
                        description="Highlights and hover states"
                    />
                    
                    <ColorPicker
                        label="Background Color"
                        value={branding.background_color}
                        onChange={(c) => updateField('background_color', c)}
                        description="Page background"
                    />
                    
                    <ColorPicker
                        label="Text Color"
                        value={branding.text_color}
                        onChange={(c) => updateField('text_color', c)}
                        description="Primary text color"
                    />
                </div>
            </section>

            {/* Live Preview */}
            <section className="space-y-4">
                <h3 className="text-lg font-medium border-b border-border pb-2">
                    Live Preview
                </h3>
                
                <div 
                    className="rounded-xl p-6 border"
                    style={{ 
                        backgroundColor: branding.background_color,
                        color: branding.text_color 
                    }}
                >
                    <div className="flex items-center gap-3 mb-4">
                        {branding.logo_url ? (
                            <img src={branding.logo_url} alt="Logo" className="h-10" />
                        ) : (
                            <div 
                                className="w-10 h-10 rounded-lg flex items-center justify-center text-xl font-bold"
                                style={{ backgroundColor: branding.primary_color }}
                            >
                                {branding.app_name.charAt(0)}
                            </div>
                        )}
                        <span className="text-2xl font-bold">{branding.app_name}</span>
                    </div>
                    
                    <p className="mb-4 opacity-80">{branding.tagline || 'Your custom tagline here'}</p>
                    
                    <div className="flex gap-3">
                        <button 
                            className="px-4 py-2 rounded-lg font-medium"
                            style={{ backgroundColor: branding.primary_color, color: branding.background_color }}
                        >
                            Primary Button
                        </button>
                        <button 
                            className="px-4 py-2 rounded-lg font-medium border"
                            style={{ 
                                borderColor: branding.secondary_color, 
                                color: branding.secondary_color 
                            }}
                        >
                            Secondary
                        </button>
                        <span 
                            className="px-4 py-2"
                            style={{ color: branding.accent_color }}
                        >
                            Accent Link
                        </span>
                    </div>
                </div>
            </section>

            {/* Logo Upload */}
            <section className="space-y-4">
                <h3 className="text-lg font-medium border-b border-border pb-2">
                    Logo
                </h3>
                
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label>Light Mode Logo</Label>
                        <div className="flex items-center gap-4">
                            {branding.logo_url && (
                                <img 
                                    src={branding.logo_url} 
                                    alt="Light logo" 
                                    className="h-12 rounded border border-border p-1 bg-white"
                                />
                            )}
                            <label className="cursor-pointer">
                                <input
                                    type="file"
                                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                                    onChange={(e) => handleLogoUpload(e, false)}
                                    className="hidden"
                                />
                                <Button variant="outline" size="sm" asChild>
                                    <span>Upload Logo</span>
                                </Button>
                            </label>
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <Label>Dark Mode Logo</Label>
                        <div className="flex items-center gap-4">
                            {branding.logo_dark_url && (
                                <img 
                                    src={branding.logo_dark_url} 
                                    alt="Dark logo" 
                                    className="h-12 rounded border border-border p-1 bg-slate-900"
                                />
                            )}
                            <label className="cursor-pointer">
                                <input
                                    type="file"
                                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                                    onChange={(e) => handleLogoUpload(e, true)}
                                    className="hidden"
                                />
                                <Button variant="outline" size="sm" asChild>
                                    <span>Upload Dark Logo</span>
                                </Button>
                            </label>
                        </div>
                    </div>
                </div>
            </section>

            {/* Additional Settings */}
            <section className="space-y-4">
                <h3 className="text-lg font-medium border-b border-border pb-2">
                    Additional Settings
                </h3>
                
                <div className="flex items-center justify-between">
                    <div>
                        <Label>Show "Powered by" badge</Label>
                        <p className="text-xs text-muted-foreground">
                            Display ACHEEVY branding in footer
                        </p>
                    </div>
                    <Switch
                        checked={branding.show_powered_by}
                        onCheckedChange={(checked) => updateField('show_powered_by', checked)}
                    />
                </div>
                
                <div className="space-y-2">
                    <Label htmlFor="footer_text">Custom Footer Text</Label>
                    <Input
                        id="footer_text"
                        value={branding.custom_footer_text || ''}
                        onChange={(e) => updateField('custom_footer_text', e.target.value)}
                        placeholder="© 2025 Your Company. All rights reserved."
                        maxLength={500}
                    />
                </div>
            </section>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
                <Button 
                    variant="outline" 
                    onClick={handleReset}
                    disabled={isSaving}
                >
                    Reset to Defaults
                </Button>
                
                <div className="flex gap-3">
                    <Button 
                        variant="outline"
                        onClick={() => setBranding(originalBranding)}
                        disabled={!hasChanges || isSaving}
                    >
                        Discard Changes
                    </Button>
                    <Button 
                        onClick={handleSave}
                        disabled={!hasChanges || isSaving}
                        className="bg-amber-500 hover:bg-amber-600"
                    >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default BrandingTab
