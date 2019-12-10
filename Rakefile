require 'rake/clean'

file 'tmp/integration.js': %w[app/integration.ts] do |t|
    # npm install -g ts
    sh *%w[tsc -t es2015 --outFile] + [t.name, t.prerequisites[0]]
end
CLEAN << 'tmp/integration.js'

file 'tmp/integration_min.js': %w[tmp/integration.js] do |t|
    # npm install -g terser
    sh 'terser', t.prerequisites[0], '-c', '-o', t.name
end
CLEAN << 'tmp/integration_min.js'

file 'out.html': %w[tmp/integration_min.js app/frame.html] do |t|
    # npm install -g inline-scripts
    sh 'inline-script-tags', t.prerequisites[1], t.name
end
CLOBBER << 'out.html'

task compile: 'tmp/integration.js'
task minify: 'tmp/integration_min.js'
task build: 'out.html'
task default: :build