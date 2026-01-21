const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );
const path = require( 'path' );
const glob = require( 'glob' );

module.exports = {
    ...defaultConfig,
    entry: () => {
        const entries = {};
        const files = glob.sync( './src/blocks/*/index.jsx' );

        files.forEach( ( file ) => {
            const name = path.basename( path.dirname( file ) );
            entries[ name ] = file;
        });

        return entries;
    },
    output: {
        path: path.resolve( process.cwd(), 'build' ),
        filename: '[name]/index.js',
    },
};
