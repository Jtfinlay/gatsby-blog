---
title: File upload in Next.js and TypeScript
date: "2021-02-16"
template: "post"
draft: false
slug: "nextjs-upload"
category: "Services"
tags:
    - "WebDev"
    - "Services"
    - "NextJS"
description: "Sharing the solution of how to create an API in Next.js that supports file upload. I hit issues that are sorted out by this implementation."
---

Sharing the solution of how to create an API in [Next.js](https://nextjs.org/) that supports file upload. I hit issues that are sorted out by this implementation.

This solution uses [multer](https://www.npmjs.com/package/multer) to handle `multipart/form-data` uploads.

We first set up a helper method that will invoke middleware before the operation, and throw an error if the middleware fails.

```jsx
import type { NextApiRequest, NextApiResponse } from 'next';

export default function initMiddleware(middleware: any) {
    return (req: NextApiRequest, res: NextApiResponse) =>
      new Promise((resolve, reject) => {
        middleware(req, res, (result) => {
            if (result instanceof Error) {
                return reject(result);
            }
            return resolve(result);
        });
    });
}
```

The implementation has a few key pieces:

1. `BodyParser` is disabled (Next.js enables this by default). Otherwise, `multer` is unable to process the files and the files are not placed in the request.
2. The files are available in the request. In this scenario, it is a video `Blob` with a Buffer within. This may vary by file type.

```jsx
import type { NextApiRequest, NextApiResponse } from 'next';
import multer from 'multer';
import initMiddleware from '../../lib/init-middleware';

const upload = multer();

// for parsing multipart/form-data
// note that Multer limits to 1MB file size by default
const multerAny = initMiddleware(
    upload.any()
);

type NextApiRequestWithFormData = NextApiRequest & {
    files: any[],
}

type BlobCorrected = Blob & {
    buffer: Buffer,
}

// Doc on custom API configuration:
// https://nextjs.org/docs/api-routes/api-middlewares#custom-config
export const config = {
    api: {
        bodyParser: false,
    },
}

export default async (req: NextApiRequestWithFormData, res: NextApiResponse) => {
    await multerAny(req, res);

    // This operation expects a single file upload. Edit as needed.
    if (!req.files?.length || req.files.length > 1) {
        res.statusCode = 400;
        res.end();
        return;
    }

    const blob: BlobCorrected = req.files[0];

    ...
}
```

Thank you! This behavior used on [ClippyTeams](https://github.com/Jtfinlay/clippy-teams/blob/main/pages/api/upload-video/%5BtenantId%5D.ts) (a side project to build a *Stories* clone in Microsoft Teams). Feel free to fork and explore.