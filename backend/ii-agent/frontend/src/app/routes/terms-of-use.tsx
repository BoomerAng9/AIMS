export function TermsOfUsePage() {
    return (
        <div className="py-8">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="bg-white dark:bg-sky-blue/10 rounded-lg shadow-lg p-8">
                    <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-8">
                        Terms of Use
                    </h1>

                    <div className="prose dark:prose-invert max-w-none">
                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                            Last updated: {new Date().toLocaleDateString()}
                        </p>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                1. Agreement to Terms
                            </h2>
                            <p className="text-gray-700 dark:text-gray-300 mb-4">
                                By accessing and using ACHEEVY, you accept and
                                agree to be bound by the terms and provision of
                                this agreement. If you do not agree to abide by
                                the above, please do not use this service.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                2. Use License
                            </h2>
                            <p className="text-gray-700 dark:text-gray-300 mb-4">
                                Permission is granted to temporarily download
                                one copy of ACHEEVY materials for personal,
                                non-commercial transitory viewing only. This is
                                the grant of a license, not a transfer of title,
                                and under this license you may not:
                            </p>
                            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4">
                                <li>modify or copy the materials</li>
                                <li>
                                    use the materials for any commercial purpose
                                    or for any public display
                                </li>
                                <li>
                                    attempt to reverse engineer any software
                                    contained in ACHEEVY
                                </li>
                                <li>
                                    remove any copyright or other proprietary
                                    notations from the materials
                                </li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                3. Disclaimer
                            </h2>
                            <p className="text-gray-700 dark:text-gray-300 mb-4">
                                {`The materials on ACHEEVY are provided on an 'as
                                is' basis. ACHEEVY makes no warranties,
                                expressed or implied, and hereby disclaims and
                                negates all other warranties including without
                                limitation, implied warranties or conditions of
                                merchantability, fitness for a particular
                                purpose, or non-infringement of intellectual
                                property or other violation of rights.`}
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                4. Limitations
                            </h2>
                            <p className="text-gray-700 dark:text-gray-300 mb-4">
                                In no event shall ACHEEVY or its suppliers be
                                liable for any damages (including, without
                                limitation, damages for loss of data or profit,
                                or due to business interruption) arising out of
                                the use or inability to use the materials on
                                ACHEEVY, even if ACHEEVY or an ACHEEVY
                                authorized representative has been notified
                                orally or in writing of the possibility of such
                                damage.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                5. Privacy Policy
                            </h2>
                            <p className="text-gray-700 dark:text-gray-300 mb-4">
                                Your privacy is important to us. Please review
                                our Privacy Policy, which also governs your use
                                of the Service, to understand our practices.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                6. Changes to Terms
                            </h2>
                            <p className="text-gray-700 dark:text-gray-300 mb-4">
                                ACHEEVY may revise these terms of service at
                                any time without notice. By using this
                                application, you are agreeing to be bound by the
                                then current version of these terms of service.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                                7. Contact Information
                            </h2>
                            <p className="text-gray-700 dark:text-gray-300 mb-4">
                                If you have any questions about these Terms of
                                Use, please contact us.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    )
}

export const Component = TermsOfUsePage
