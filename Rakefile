file 'app/integration.js': %w[app/integration.ts] do |t|
    # npm install -g ts
    sh *%w[tsc -t es2015] << t.prerequisites[0]
end

file 'out.html': %w[app/integration.js app/frame.html] do |t|
    # npm install -g inline-scripts
    sh *%w[inline-script-tags app/frame.html] << t.name
end

task default: 'out.html'