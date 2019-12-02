file 'integration.js': %w[integration.ts] do
    # npm install -g ts
    sh *%w[tsc -t es2015 integration.ts] 
end

file 'out.html': %w[integration.js frame.html] do
    # npm install -g inline-scripts
    sh *%w[inline-script-tags frame.html out.html]
end

task default: 'out.html'