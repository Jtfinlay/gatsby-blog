module.exports = {
    siteMetadata: {
        title: 'James Finlay - Coder, Cook',
        author: 'James Finlay'
    },
    plugins: [
        {
            resolve: `gatsby-plugin-google-analytics`,
            options: {
                trackingId: "UA-108088936-2",
                head: false,
                anonymize: true,
                respectDNT: true
            },
        },
        'gatsby-plugin-react-helmet',
        'gatsby-plugin-sass',
        {
            resolve: 'gatsby-source-filesystem',
            options: {
                name: `pages`,
                path: `${__dirname}/posts`,
            }
        },
        {
            resolve: 'gatsby-source-filesystem',
            options: {
                name: `img`,
                path: `${__dirname}/images`,
            }
        },
        {
            resolve: `gatsby-transformer-remark`,
            options: {
                plugins: [
                    `gatsby-remark-images`,
                    `gatsby-remark-copy-linked-files`,
                    `gatsby-remark-prismjs`,
                ],
            },
        },
        `gatsby-transformer-sharp`,
        `gatsby-plugin-sharp`,
    ],
}
