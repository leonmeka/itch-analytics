export const legalDocuments = {
  terms: {
    title: 'Terms and Conditions',
    intro:
      'These terms cover the Scratch website at getscratch.app and companion app. By using the service, you agree to these terms. If you do not agree, stop using the service.',
    sections: [
      [
        'The companion app',
        'Scratch helps you view your itch.io sales, games, and creator activity. It is an independent project and is not affiliated with, endorsed by, or sponsored by itch.io or Itch Corp. itch.io and its logo belong to their respective owner.',
      ],
      [
        'Your account',
        'Use only accounts and data you own or are authorized to access. You are responsible for keeping your device and account credentials secure. Your use of itch.io remains subject to its own terms and policies.',
      ],
      [
        'Permitted use',
        'You may use the app for your own creator activity. Do not bypass access controls, access another person’s private data, disrupt the service, or use it unlawfully. Only import data you are entitled to process, including any customer information.',
      ],
      [
        'Your data and content',
        'You retain your rights in your games and imported data. You allow us to process that data to provide the features you use, as described in the Privacy Policy. Using the app does not transfer ownership of your content.',
      ],
      [
        'Figures and availability',
        'Dashboard figures depend on imported records, successful syncs, and third-party services. They may be incomplete, delayed, or inaccurate. Verify figures against itch.io records before relying on them for accounting, tax, or business decisions. The app does not provide financial or tax advice.',
      ],
      [
        'Third-party services',
        'Sign-in and synchronization rely on itch.io. App distribution may involve Apple or Google. Those services have their own terms and privacy policies. Changes or outages outside our control can affect app features.',
      ],
      [
        'Updates and ending use',
        'Features may change as the app develops. You can stop using the app at any time. Signing out or uninstalling does not by itself delete server-side records. Access may be restricted when needed to address misuse or protect the service.',
      ],
      [
        'Responsibility',
        'To the extent permitted by applicable law, the service is provided as available without a guarantee of uninterrupted operation or accuracy. Nothing in these terms excludes liability that cannot lawfully be excluded, or limits your mandatory consumer rights.',
      ],
      [
        'Changes and questions',
        'Revisions will appear here with an updated date. Material changes should be communicated before they apply where required by law.',
      ],
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    intro:
      'This policy describes how the Scratch website at getscratch.app and companion app handle information. It covers sign-in, synchronization, and dashboard data.',
    sections: [
      [
        'Who is responsible',
        'The operator of Scratch is responsible for the processing described here.',
      ],
      [
        'Account and sign-in data',
        'When you connect itch.io, the service processes your account identifier, profile information returned by itch.io, OAuth access token, and app session records. The app uses these to identify you, authenticate requests, and synchronize your account.',
      ],
      [
        'Sales and dashboard data',
        'Synchronization processes game information, view statistics, and purchase exports. Stored purchase records include transaction identifiers, product names, amounts, currencies, dates, country codes, fees, taxes, tips, and payout information when present. Buyer email addresses in purchase exports are processed to derive a keyed customer identifier; the raw email address is not stored in the payments table. The derived identifier is pseudonymous, not anonymous.',
      ],
      [
        'Device storage and security',
        'The mobile app stores session credentials and an itch.io access token using the device’s secure storage, along with sync state. Server-side itch.io tokens are encrypted at rest. Signing out removes local credentials but does not automatically erase server-side account or sales records.',
      ],
      [
        'Why information is processed',
        'Account and sync data are used to deliver the features you request. Where the GDPR applies, processing needed to provide the service relies on performance of the service agreement. Security processing may rely on legitimate interests in protecting accounts and systems; legally required processing relies on the relevant legal obligation. Any optional processing requiring consent must use a separate consent mechanism.',
      ],
      [
        'Website storage',
        'The landing page does not include advertising trackers or a third-party analytics SDK. Authentication endpoints use session cookies where applicable. Infrastructure may process request information such as IP addresses and browser details to serve and secure the service.',
      ],
      [
        'Recipients and international transfers',
        'Requests to itch.io share the credentials and request information needed for sign-in and synchronization. Hosting and database providers may process information on the operator’s behalf. Apple and Google separately handle their app-store services under their own policies.',
      ],
      [
        'Retention and deletion',
        'Account and synchronized records are stored on the server. There is no automatic deletion schedule. Signing out or uninstalling does not delete them.',
      ],
      [
        'Your rights',
        'Depending on applicable law, you may request access, correction, deletion, restriction, or portability of your personal information, and object to processing based on legitimate interests. Where processing relies on consent, you may withdraw it without affecting earlier processing. You may lodge a complaint with your local data protection authority.',
      ],
      [
        'Changes',
        'Changes to this policy will be published here with a revised date. Material changes to how information is handled should be communicated as required by applicable law.',
      ],
    ],
  },
} as const;
