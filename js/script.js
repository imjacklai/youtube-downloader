var childProcess = require('child_process');
var processQueue = new Array();
var maxProcessCount = 2;
var currentProcessCount = 0;
var argus = null;

// localStorage.clear();

$('#link').click(function() {
  gui.Shell.openExternal("https://github.com/rg3/youtube-dl");
});

$('.title, .title i').click(function() {
  $('.basic.modal').modal('show');
})

// set the download settings for users that they used last time
$('#video-format').dropdown('set selected', localStorage.videoFormat);
$('#audio-format').dropdown('set selected', localStorage.audioFormat);
$('#path-dialog').prop('nwworkingdir', localStorage.dirPath);
$('#path-chooser').data('content', localStorage.dirPath);

// video-format dropdown event
// store the format into local storage for next time use
$('#video-format').dropdown({
  action: 'activate',
  onChange: function(value) {
    if (value != null)
      localStorage.videoFormat = value;
  }
});

// audio-format dropdown event
// store the format into local storage for next time use
$('#audio-format').dropdown({
  action: 'activate',
  onChange: function(value) {
    if (value != null)
      localStorage.audioFormat = value;
  }
});

// display the current download directory path when hover on it
$('#path-chooser').popup();

// choose the download directory path
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

    argus = [].slice();
    var videoFormat = $('#video-format').dropdown('get text');
    var audioFormat = $('#audio-format').dropdown('get text');
    
    if ((videoFormat == '影片格式' || videoFormat == '不下載') && (audioFormat == '音樂格式' || audioFormat == '不下載')) {
      // display error message
      $('.icon.input').addClass('error');
      $(this).prop('placeholder', '請至少選擇一種下載格式').transition('shake');
      return;
    }
    if (videoFormat != '影片格式' && videoFormat != '不下載')
      argus.push("-k", "-f", videoFormat);
    if (audioFormat != '音樂格式' && audioFormat != '不下載')
      argus.push("-x", "--audio-format", audioFormat);

    argus.push("-o", $('#path-chooser').data('content') + "/%(title)s.%(ext)s", url);
    getTitle(argus);
  }
});

function getTitle(argus) {
  var url = argus[argus.length - 1];
  var id = url.match(/v=((\d|\w|\S){11})/);
  if (id != null)
    id = id[1];
  else {
    $('.icon.input').addClass('error');
    $('#url-input').prop('placeholder', '這不是正確的網址').transition('shake');
    return;
  }

  var type = null;
  var color = null;

  if (url.indexOf("list=") != -1) {
    type = "清單";
    color = "teal";
  }
  else {
    type = "單曲";
    color = "red";
  }

  $('.icon.input').removeClass('error').addClass('loading');
  $('#url-input').prop('disabled', 'disabled').prop('placeholder', '貼上youtube影片網址，並按下enter開始下載');

  // Get video's title
  childProcess.exec("youtube-dl -e " + url, { encoding: 'utf8' }, function(error, stdout, stderr) {
    if (error !== null) {
      $('div.icon.input').removeClass('loading').addClass('error');
      $('#url-input').prop('disabled', false).prop('placeholder', '這不是正確的網址').transition('shake');
    }
    else {
      $('div.icon.input').removeClass('loading');
      $('#url-input').prop('disabled', false);
      var progressbar = "<div class='ui tiny " + color + " horizontal label'>" + type + "</div> \
                         <span id='title-" + id + "'>" + stdout + "</span> \
                         <div id='" + id + "' class='ui small progress'> \
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
  var url = argus[argus.length - 1];
  var id = url.match(/v=((\d|\w|\S){11})/)[1];
  var type = null;
  currentProcessCount += 1;

  if (url.indexOf("list=") != -1) {
    type = "list";
  }
  else {
    type = "single";
  }

  var message = ['', '', 0, 0];

  var child = childProcess.spawn("youtube-dl", argus);
  child.stdout.on('data', function (data) {
    if (type == 'single') {
      var value = parseInt($.trim(data).split(" ")[2].split("%")[0]);
      if (value >= 0)
        $('#' + id).progress({ percent: value });
    }
    else if (type == 'list') {
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
        
        $('#title-' + id).html(message.slice(0, 2).join(": "));
        $('#' + id).progress({ percent: (message[2]-1)/message[3] });
      }
    }
  });

  child.stderr.on('data', function (data) {});

  child.on('exit', function (code) {
    $('#' + id).progress({ percent: 100 });
    currentProcessCount -= 1;
    if (currentProcessCount < maxProcessCount && processQueue.length != 0) {
      download(processQueue.shift())
    }
  });
}