file 'app/integration.js': %w[app/integration.ts] do
    # npm install -g ts
    sh *%w[tsc -t es2015 app/integration.ts] 
end

file 'out.html': %w[app/integration.js app/frame.html] do
    # npm install -g inline-scripts
    sh *%w[inline-script-tags app/frame.html out.html]
end

task default: 'out.html'