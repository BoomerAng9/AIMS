import GuestPrompt from "@/components/halalhub/GuestPrompt";

export default function HalalHubLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            {/* The main child routes (Landing, Auth, Shop, etc.) */}
            {children}

            {/* Global HalalHub Component: 30-Second Non-obtrusive Guest Timer */}
            <GuestPrompt />
        </>
    );
}
