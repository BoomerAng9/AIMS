"use client";

import { LogoWallBackground } from "@/components/LogoWallBackground";
import { SiteHeader } from "@/components/SiteHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Key, Bell, User, Trash2, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <LogoWallBackground mode="dashboard">
      <SiteHeader />
      <main className="flex-1 container max-w-4xl py-8 px-4 md:px-6">
        <div className="mb-8">
          <h1 className="text-2xl font-display text-white tracking-wide">Settings</h1>
          <p className="text-zinc-400 text-sm">Configure your A.I.M.S. workspace</p>
        </div>

        <div className="space-y-6">
          {/* Identity Section */}
          <Card className="border-white/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-amber-400" />
                Identity
              </CardTitle>
              <CardDescription>Your profile and workspace settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs text-zinc-400 uppercase tracking-wider">Display Name</label>
                <Input defaultValue="Commander" className="mt-1 bg-black/50 border-white/10" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 uppercase tracking-wider">Email</label>
                <Input defaultValue="commander@aims.ai" className="mt-1 bg-black/50 border-white/10" />
              </div>
            </CardContent>
          </Card>

          {/* Security Section */}
          <Card className="border-white/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-emerald-400" />
                Security
              </CardTitle>
              <CardDescription>Authentication and access controls</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-white text-sm">Two-Factor Authentication</p>
                  <p className="text-zinc-500 text-xs">Add an extra layer of security</p>
                </div>
                <Button variant="outline" size="sm" className="border-emerald-500/30 text-emerald-400">
                  Enable
                </Button>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-white text-sm">Session Timeout</p>
                  <p className="text-zinc-500 text-xs">Auto-logout after inactivity</p>
                </div>
                <select className="bg-black/50 border border-white/10 rounded px-3 py-1 text-sm text-white">
                  <option>30 minutes</option>
                  <option>1 hour</option>
                  <option>4 hours</option>
                  <option>Never</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* API Keys Section */}
          <Card className="border-white/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-blue-400" />
                API Keys
              </CardTitle>
              <CardDescription>Manage your integration credentials</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <div>
                  <p className="text-white text-sm font-mono">aims_live_****...4f2x</p>
                  <p className="text-zinc-500 text-xs">Created Feb 1, 2026</p>
                </div>
                <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300">
                  Revoke
                </Button>
              </div>
              <Button variant="outline" size="sm" className="w-full border-white/10">
                + Generate New Key
              </Button>
            </CardContent>
          </Card>

          {/* Notifications Section */}
          <Card className="border-white/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-yellow-400" />
                Notifications
              </CardTitle>
              <CardDescription>Control how ACHEEVY contacts you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-white text-sm">Email notifications</span>
                <input type="checkbox" defaultChecked className="accent-amber-500" />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white text-sm">Task completion alerts</span>
                <input type="checkbox" defaultChecked className="accent-amber-500" />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white text-sm">Usage quota warnings</span>
                <input type="checkbox" defaultChecked className="accent-amber-500" />
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-500/20 bg-red-950/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-400">
                <Trash2 className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription className="text-red-300/60">Irreversible actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-white text-sm">Delete all data</p>
                  <p className="text-zinc-500 text-xs">Permanently remove all your workspace data</p>
                </div>
                <Button variant="outline" size="sm" className="border-red-500/30 text-red-400 hover:bg-red-500/10">
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button variant="acheevy" onClick={handleSave} className="gap-2">
              <Save className="h-4 w-4" />
              {saved ? "Saved!" : "Save Changes"}
            </Button>
          </div>
        </div>
      </main>
    </LogoWallBackground>
  );
}
