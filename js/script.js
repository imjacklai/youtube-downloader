var childProcess = require('child_process');
var processQueue = new Array();
var maxProcessCount = 2;
var currentProcessCount = 0;
var color = { '單曲': 'red', '清單': 'teal' };

$('#youtube-dl-link').click(function() {
  gui.Shell.openExternal("https://github.com/rg3/youtube-dl");
});

$('#ffmpeg-link').click(function() {
  gui.Shell.openExternal("https://www.ffmpeg.org/");
});

$('.title, .title i').click(function() {
  $('.basic.modal').modal('show');
})

// set the download settings for users that they used last time
$('#video-format').dropdown('set selected', localStorage.videoFormat);
$('#audio-format').dropdown('set selected', localStorage.audioFormat);
$('#path-dialog').prop('nwworkingdir', localStorage.dirPath);
$('#path-chooser').data('content', localStorage.dirPath);

// video-format dropdown event, store the format into local storage for next time use
$('#video-format').dropdown({
  action: 'activate',
  onChange: function(value) {
    if (value != null) localStorage.videoFormat = value;
  }
});

// audio-format dropdown event, store the format into local storage for next time use
$('#audio-format').dropdown({
  action: 'activate',
  onChange: function(value) {
    if (value != null) localStorage.audioFormat = value;
  }
});

// display the current directory path when hover on it
$('#path-chooser').popup();

// choose the directory path
$('#path-chooser').click(function() {
  var chooser = $('#path-dialog');
  chooser.change(function(event) {
    var path = $(this).val();
    if (path != '') {
      $('#path-dialog').prop('nwworkingdir', path);
      $('#path-chooser').data('content', path);
      localStorage.dirPath = path;
    }
  });
  chooser.trigger('click');
});

// detect the input field key press event
$('#url-input').keypress(function(event) {
  // only press enter will do the following
  if(event.keyCode == '13') {
    var url = $(this).val();
    if (url == '') return;
    $(this).val('');

    var argus = [];
    var videoFormat = $('#video-format').dropdown('get text');
    var audioFormat = $('#audio-format').dropdown('get text');
    
    if ((videoFormat == '影片格式' || videoFormat == '不下載') && (audioFormat == '音樂格式' || audioFormat == '不下載')) {
      showErrorMessage('請至少選擇一種下載格式');
      return;
    }
    if (videoFormat != '影片格式' && videoFormat != '不下載')
      argus.push("-k", "-f", videoFormat);
    if (audioFormat != '音樂格式' && audioFormat != '不下載')
      argus.push("-x", "--audio-format", audioFormat);

    argus.push("-o", $('#path-chooser').data('content') + "/%(title)s.%(ext)s", url);

    var id = url.match(/v=((\d|\w|\S){11})/);
    if (id != null) {
      id = id[1];
    }
    else {
      showErrorMessage('這不是正確的網址');
      return;
    }

    var type = (url.indexOf("list=") != -1) ? '清單' : '單曲';
    getTitle({'argus': argus, 'url': url, 'id': id, 'type': type});
  }
});

function getTitle(argus) {
  $('.icon.input').removeClass('error').addClass('loading');
  $('#url-input').prop('disabled', 'disabled').prop('placeholder', '載入中...');

  // Get video's title
  childProcess.exec("youtube-dl -e " + argus['url'], { encoding: 'utf8' }, function(error, stdout, stderr) {
    $('div.icon.input').removeClass('loading');
    $('#url-input').prop('disabled', false);
    if (error !== null) {
      showErrorMessage('這不是正確的網址');
    }
    else {
      $('#url-input').prop('placeholder', '貼上youtube影片網址，並按下enter開始下載')
      var progressbar = "<div class='ui tiny " + color[argus['type']] + " horizontal label'>" + argus['type'] + "</div> \
                         <span id='title-" + argus['id'] + "'>" + stdout + "</span> \
                         <div id='" + argus['id'] + "' class='ui small progress'> \
                          <div class='bar'> \
                            <div class='progress'></div> \
                          </div> \
                         </div>";
      $(".container").append(progressbar);
      if (currentProcessCount < maxProcessCount)
        download(argus);
      else
        processQueue.push(argus);
    }
  });
}

function download(argus) {
  currentProcessCount += 1;
  var message = ['', '', 0, 0];

  var child = childProcess.spawn("youtube-dl", argus['argus']);
  child.stdout.on('data', function (data) {
    if (argus['type'] == '單曲') {
      var value = parseInt($.trim(data).split(" ")[2].split("%")[0]);
      if (value >= 0)
        $('#' + argus['id']).progress({ percent: value });
    }
    else if (argus['type'] == '清單') {
      var currentNumAndTotalNum = data.toString().match(/#(\d{1,3}) of (\d{1,3})/);
      var currentTitle = data.toString().match(/Destination\:(.*)\.\w+/);

      if (currentNumAndTotalNum != null) {
        message[0] = currentNumAndTotalNum[0];            // eg. 3 of 111
        message[2] = parseInt(currentNumAndTotalNum[1]);  // the current video's number
        message[3] = parseInt(currentNumAndTotalNum[2]);  // number of total videos
      }
      if (currentTitle != null) {
        var temp = currentTitle[1].split('/');
        message[1] = temp[temp.length - 1];
        
        $('#title-' + argus['id']).html(message.slice(0, 2).join(": "));
        $('#' + argus['id']).progress({ percent: (message[2]-1)/message[3] });
      }
    }
  });

  child.stderr.on('data', function (data) {});

  child.on('exit', function (code) {
    $('#' + argus['id']).progress({ percent: 100 });
    currentProcessCount -= 1;
    if (currentProcessCount < maxProcessCount && processQueue.length != 0) {
      download(processQueue.shift())
    }
  });
}

function showErrorMessage(message) {
  $('.icon.input').addClass('error');
  $('#url-input').prop('placeholder', message).transition('shake');
}