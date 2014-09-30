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

pixivパワーの算出には、閲覧数をはじめとする各投稿作品のパラメータおよび、投稿間隔やフォロワー数などの個人のパラメータを利用しています。

## Dependencies

以下のライブラリに依存しています。

- [jQuery](http://jquery.com)
- [jQuery UI](http://jqueryui.com)
- [D3](http://d3js.org)
- [Font Awesome by Dave Gandy](http://fontawesome.io)

上記の他、eshies.netからHTMLテンプレートやスタイルシートなどの必要ファイルを取り出しています。

## CLI

測定完了後、ブラウザのコンソールから次のようなコマンドを実行することで、変数に保存された情報を見ることができます。

ユーザー情報を見る場合

```js
ppc.user.getAll()
```

最新から3つ目のイラストの情報を見る場合

```js
ppc.illusts[2].getAll()
```

その他のAPIは[Cloz](https://github.com/KNJ/cloz)を参照してください。
