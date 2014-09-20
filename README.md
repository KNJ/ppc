pixivパワーチェッカー
===

## Introduction

pixivパワーチェッカーは、pixivにおける自分の影響力を測定する非公式のブックマークレットスクリプトです。

## How to use

<http://eshies.net/ppc>からブックマークレットを登録し、<http://www.pixiv.net/member_illust.php>または<http://www.pixiv.net/member_illust.php?res=full>で実行します。緑色の測定ボタンが現れたら、それをクリックすることで自動で測定が行われます。

## Browser compatibility

以下のブラウザでの動作に対応しています。

- Internet Explorer 9+
- Firefox
- Google Chrome
- Safari
- Opera

ただし、IEではTwitter連携によるパワーの保存が効かないので注意してください。

## Logic

閲覧数をはじめとする各投稿作品のパラメータおよび、投稿間隔やフォロワー数などの個人のパラメータを計算要素として利用しています。

## Dependencies

以下のライブラリに依存しています。

- [jQuery](jquery.com)
- [jQuery UI](jqueryui.com)
- [Font Awesome by Dave Gandy](http://fontawesome.io)

上記の他、eshies.netからHTMLテンプレートやスタイルシートなどの必要ファイルを取り出しています。