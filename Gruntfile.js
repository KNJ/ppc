module.exports = function(grunt){
    grunt.initConfig({

        concat: {
            build: {
                src: 'src/*.js',
                dest: 'ppc.js'

            }
        }

    });

    grunt.loadNpmTasks('grunt-contrib-concat');

    grunt.registerTask('default', ['concat']);
};
