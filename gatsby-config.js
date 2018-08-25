module.exports = {
    siteMetadata: {
        title: 'James Finlay - Coder, Cook',
        author: 'James Finlay'
    },
    plugins: [
        'gatsby-plugin-react-helmet',
        'gatsby-plugin-sass',
        {
            resolve: 'gatsby-source-filesystem',
            options: {
                path: `${__dirname}/posts`,
                name: "pages",
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
