require('dotenv').config()

if (!process.env.GATSBY_GITHUB_TOKEN) {
  // eslint-disable-next-line
  console.warn(`

      ⚠️  A GitHub token as GATSBY_GITHUB_TOKEN is required to build some parts of the blog.
      ⚠️  Check the README https://github.com/perminder-klair/blog.klair.co#-development.

  `)
}

const siteConfig = require('./config')
const sources = require('./gatsby/sources')
const { feedContent } = require('./gatsby/feeds')

// required for gatsby-plugin-meta-redirect
require('regenerator-runtime/runtime')

module.exports = {
  siteMetadata: {
    ...siteConfig
  },
  plugins: [
    ...sources,
    {
      resolve: 'gatsby-plugin-sharp',
      options: {
        stripMetadata: false,
        defaultQuality: 75
      }
    },
    'gatsby-transformer-sharp',
    {
      resolve: 'gatsby-transformer-remark',
      options: {
        excerpt_separator: '<!-- more -->',
        plugins: [
          'gatsby-remark-breaks',
          {
            resolve: 'gatsby-remark-images',
            options: {
              maxWidth: 666,
              quality: 80,
              linkImagesToOriginal: false,
              showCaptions: true,
              backgroundColor: 'none',
              disableBgImageOnAlpha: true
            }
          },
          {
            resolve: 'gatsby-remark-images-medium-zoom',
            options: {
              background: '#e7eef4'
            }
          },
          {
            resolve: 'gatsby-remark-copy-linked-files',
            options: {
              destinationDir: 'media'
            }
          },
          'gatsby-remark-smartypants',
          {
            resolve: 'gatsby-remark-autolink-headers',
            options: {
              icon: '<span>#</span>'
            }
          },
          {
            // https://github.com/andrewbranch/gatsby-remark-vscode
            resolve: 'gatsby-remark-vscode',
            options: {
              theme: {
                default: 'Polar',
                parentSelector: { 'body.dark': 'Nord' }
              },
              injectStyles: false,
              extensions: [
                'nord-visual-studio-code',
                `${__dirname}/vendor/polar-0.0.6.vsix`
              ],
              languageAliases: {}
            }
          }
        ]
      }
    },
    {
      resolve: 'gatsby-plugin-sass',
      options: {
        includePaths: [`${__dirname}/node_modules`, `${__dirname}/src/styles`]
      }
    },
    {
      resolve: 'gatsby-plugin-svgr',
      options: {
        icon: false,
        svgoConfig: {
          plugins: [{ removeViewBox: false }]
        }
      }
    },
    {
      resolve: 'gatsby-plugin-lunr',
      options: {
        languages: [
          {
            // ISO 639-1 language codes. See https://lunrjs.com/guides/language_support.html for details
            name: 'en'
          }
        ],
        // Fields to index. If store === true value will be stored in index file.
        // Attributes for custom indexing logic. See https://lunrjs.com/docs/lunr.Builder.html for details
        fields: [
          { name: 'title', attributes: { boost: 20 } },
          { name: 'tags', attributes: { boost: 15 } },
          { name: 'excerpt', attributes: { boost: 10 } },
          { name: 'slug', store: true },
          { name: 'content' }
        ],
        // How to resolve each field's value for a supported node type
        resolvers: {
          // For any node of type MarkdownRemark, list how to resolve the fields' values
          MarkdownRemark: {
            title: (node) => node.frontmatter.title,
            excerpt: (node) => node.excerpt,
            tags: (node) => node.frontmatter.tags,
            content: (node) => node.rawMarkdownBody,
            slug: (node) => node.fields.slug
          }
        }
      }
    },
    {
      resolve: 'gatsby-plugin-matomo',
      options: {
        siteId: '1',
        matomoUrl: 'https://blog.klair.co', // TODO:
        siteUrl: `${siteConfig.siteUrl}`,
        trackLoad: false
      }
    },
    {
      resolve: 'gatsby-plugin-manifest',
      options: {
        name: siteConfig.siteTitle,
        start_url: '/',
        background_color: siteConfig.backgroundColor,
        theme_color: siteConfig.themeColor,
        icon: 'src/images/apple-touch-icon.png',
        display: 'standalone',
        cache_busting_mode: 'name',
        theme_color_in_head: false // dynamically set in ThemeSwitch
      }
    },
    {
      resolve: 'gatsby-plugin-feed',
      options: {
        query: `
          {
            site {
              siteMetadata {
                siteTitle
                siteDescription
                siteUrl
                title: siteTitle
                description: siteDescription
                site_url: siteUrl
              }
            }
          }
        `,
        feeds: [
          {
            serialize: ({ query: { allMarkdownRemark } }) => {
              return allMarkdownRemark.edges.map((edge) => {
                return Object.assign({}, edge.node.frontmatter, {
                  title: edge.node.frontmatter.title,
                  date: edge.node.fields.date,
                  description: edge.node.excerpt,
                  url: siteConfig.siteUrl + edge.node.fields.slug,
                  categories: edge.node.frontmatter.tags,
                  author: siteConfig.author.name,
                  guid: siteConfig.siteUrl + edge.node.fields.slug,
                  custom_elements: [{ 'content:encoded': feedContent(edge) }]
                })
              })
            },
            query: `
              {
                allMarkdownRemark(
                  sort: { order: DESC, fields: [fields___date] },
                  limit: 40
                ) {
                  edges {
                    node {
                      html
                      fields { slug, date }
                      excerpt
                      frontmatter {
                        title
                        image {
                          childImageSharp {
                            resize(width: 940, quality: 85) {
                              src
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            `,
            output: '/feed.xml',
            title: siteConfig.siteTitle
          }
        ]
      }
    },
    {
      resolve: 'gatsby-plugin-sitemap',
      options: {
        exclude: ['/page/*', '/tags/**/*', '/thanks', '/tags']
      }
    },
    {
      resolve: 'gatsby-plugin-use-dark-mode',
      options: {
        ...siteConfig.darkModeConfig,
        minify: true
      }
    },
    'gatsby-plugin-react-helmet',
    'gatsby-plugin-catch-links',
    'gatsby-redirect-from',
    'gatsby-plugin-meta-redirect',
    'gatsby-plugin-offline',
    'gatsby-plugin-webpack-size'
    // {
    //   resolve: 'gatsby-plugin-webpack-bundle-analyser-v2',
    //   options: {
    //     devMode: true
    //   }
    // }
  ]
}
