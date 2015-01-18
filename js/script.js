var process = require('child_process');
var process_queue = new Array();
var max_process = 2;
var current_process_count = 0;
var argus = null;

$('.dropdown').dropdown({ action: 'activate' });
$('.dropdown, #path-chooser').popup();

$('#path-chooser').click(function() {
  var chooser = $('#path-dialog');
  chooser.change(function(event) {
    $('#path-chooser').data('content', $(this).val());
  });
  chooser.trigger('click');
});

$('#youtube-url').keypress(function(event) {
  if(event.keyCode == '13') {
    var url = $(this).val();
    if (url == '') return;
    $('#youtube-url').val('');

    argus = [].slice();
    var video_format = $('#video-format').dropdown('get text');
    var audio_format = $('#audio-format').dropdown('get text');
    
    if (video_format != '影片格式' && video_format != '不下載' && (audio_format == '音樂格式' || audio_format == '不下載')) {
      argus.push("-f", video_format);
    }
    else if ((video_format == '影片格式' || video_format == '不下載') && audio_format != '音樂格式' && audio_format != '不下載') {
      argus.push("-x", "--audio-format", audio_format);
    }
    else if (video_format != '影片格式' && video_format != '不下載' && audio_format != '音樂格式' && audio_format != '不下載') {
      argus.push("-k", "-x", "-f", video_format, "--audio-format", audio_format);
    }
    else {
      return;
    }

    argus.push("-o", $('#path-chooser').data('content') + "/%(title)s.%(ext)s", url);
    get_title(argus);
  }
});

function get_title(argus) {
  $('div.icon.input').removeClass('error').addClass('loading');
  $('#youtube-url').prop('disabled', 'disabled').prop('placeholder', '貼上youtube影片網址，並按下enter開始下載');
  var url = argus[argus.length - 1];
  var id = url.split("=")[1];

  // Get video's title
  process.exec("youtube-dl -e " + url, { encoding: 'utf8' }, function(error, stdout, stderr) {
    if (error !== null) {
      $('div.icon.input').removeClass('loading').addClass('error');
      $('#youtube-url').prop('disabled', false).prop('placeholder', '這不是正確的網址');
    }
    else {
      $('div.icon.input').removeClass('loading');
      $('#youtube-url').prop('disabled', false);
      var progressbar = "<div id='" + id + "' class='ui progress'> \
                           <span>" + stdout + "</span> \
                           <div class='bar'> \
                             <div class='progress'></div> \
                           </div> \
                         </div>";
      $(".container").append(progressbar);
      if (current_process_count < max_process)
        download(argus);
      else
        process_queue.push(argus);
    }
  });
}

function download(argus) {
  var url = argus[argus.length - 1];
  var id = url.split("=")[1];
  current_process_count += 1;

  var child = process.spawn("youtube-dl", argus);
  child.stdout.on('data', function (data) {
    var value = parseInt($.trim(data).split(" ")[2].split("%")[0]);
    if (value >= 0)
      $('#' + id).progress({ percent: value });
  });

  child.stderr.on('data', function (data) {
  });

  child.on('exit', function (code) {
    $('#' + id).progress({ percent: 100 });
    current_process_count -= 1;
    if (current_process_count < max_process && process_queue.length != 0) {
      download(process_queue.shift())
    }
  });
}