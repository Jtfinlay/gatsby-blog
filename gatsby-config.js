module.exports = {
    siteMetadata: {
        title: 'James Finlay - Coder, Cook',
    },
    plugins: [
        'gatsby-plugin-react-helmet',
        'gatsby-plugin-sass',
        {
            resolve: 'gatsby-source-filesystem',
            options: {
                path: `${__dirname}/posts`,
                name: "markdown-pages",
            }
        },
        `gatsby-transformer-remark`
    ],
}
