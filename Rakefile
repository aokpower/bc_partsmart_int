file 'tmp/integration.js': %w[app/integration.ts] do |t|
    # npm install -g ts
    sh *%w[tsc -t es2015 --outFile] + [t.name, t.prerequisites[0]]
end

file 'tmp/integration_min.js': %w[tmp/integration.js] do |t|
    # npm install -g terser
    sh 'terser', t.prerequisites[0], '-c', '-o', t.name
end

file 'out.html': %w[tmp/integration_min.js app/frame.html] do |t|
    # npm install -g inline-scripts
    sh 'inline-script-tags', t.prerequisites[1], t.name
end

task default: 'out.html'