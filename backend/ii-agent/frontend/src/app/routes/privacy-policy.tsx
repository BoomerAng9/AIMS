export function PrivacyPolicyPage() {
    return (
        <div className="py-8">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="bg-white dark:bg-sky-blue/10 rounded-lg shadow-lg p-8">
                    <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-8">
                        Privacy Policy
                    </h1>

                    <div className="prose dark:prose-invert max-w-none">
                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                            Last updated: {new Date().toLocaleDateString()}
                        </p>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                1. Information We Collect
                            </h2>
                            <p className="text-gray-700 dark:text-gray-300 mb-4">
                                We collect information you provide directly to
                                us, such as when you create an account, use our
                                services, or contact us for support.
                            </p>
                            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
                                <li>Email address</li>
                                <li>Account credentials</li>
                                <li>
                                    Usage data and interactions with our service
                                </li>
                                <li>
                                    Technical information such as IP address and
                                    device information
                                </li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                2. How We Use Your Information
                            </h2>
                            <p className="text-gray-700 dark:text-gray-300 mb-4">
                                We use the information we collect to:
                            </p>
                            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
                                <li>
                                    Provide, maintain, and improve our services
                                </li>
                                <li>
                                    Process transactions and send related
                                    information
                                </li>
                                <li>
                                    Send technical notices and support messages
                                </li>
                                <li>Respond to your comments and questions</li>
                                <li>Monitor and analyze usage patterns</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                3. Information Sharing
                            </h2>
                            <p className="text-gray-700 dark:text-gray-300 mb-4">
                                We do not sell, trade, or otherwise transfer
                                your personal information to third parties
                                without your consent, except as described in
                                this policy. We may share information in the
                                following circumstances:
                            </p>
                            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
                                <li>With your consent</li>
                                <li>To comply with legal obligations</li>
                                <li>To protect our rights and safety</li>
                                <li>In connection with a business transfer</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                4. Data Security
                            </h2>
                            <p className="text-gray-700 dark:text-gray-300 mb-4">
                                We implement appropriate security measures to
                                protect your personal information against
                                unauthorized access, alteration, disclosure, or
                                destruction. However, no method of transmission
                                over the Internet or electronic storage is 100%
                                secure.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                5. Data Retention
                            </h2>
                            <p className="text-gray-700 dark:text-gray-300 mb-4">
                                We retain your personal information for as long
                                as necessary to provide our services and fulfill
                                the purposes outlined in this privacy policy,
                                unless a longer retention period is required by
                                law.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                6. Your Rights
                            </h2>
                            <p className="text-gray-700 dark:text-gray-300 mb-4">
                                You have certain rights regarding your personal
                                information, including:
                            </p>
                            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
                                <li>Access to your personal information</li>
                                <li>Correction of inaccurate information</li>
                                <li>Deletion of your personal information</li>
                                <li>Restriction of processing</li>
                                <li>Data portability</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                7. Cookies and Tracking
                            </h2>
                            <p className="text-gray-700 dark:text-gray-300 mb-4">
                                We use cookies and similar tracking technologies
                                to enhance your experience on our service. You
                                can control cookies through your browser
                                settings.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                8. Changes to This Policy
                            </h2>
                            <p className="text-gray-700 dark:text-gray-300 mb-4">
                                {`We may update this privacy policy from time to time. We will notify you of any changes by 
                                posting the new privacy policy on this page and updating the "Last updated" date.`}
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                9. Contact Us
                            </h2>
                            <p className="text-gray-700 dark:text-gray-300 mb-4">
                                If you have any questions about this Privacy
                                Policy, please contact us.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    )
}

export const Component = PrivacyPolicyPage
