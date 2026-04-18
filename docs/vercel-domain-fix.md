# Vercel Custom Domain Fix

`mybagpro.jp` が最新 deployment を見ないときは、まず DNS を確認する。

## いま確認できた状態

- `mybagpro.jp` の A レコード: `216.198.79.1`
- `www.mybagpro.jp`: レコードなし
- Vercel の `domains inspect` では `www.mybagpro.jp` が未設定

つまり、今の `mybagpro.jp` は Vercel ではない別の向き先を見ている。
この状態だと、`my-bag-pro.vercel.app` では最新でも、`mybagpro.jp` は古い表示のまま残る。

## 一番安く直す方法

DNS プロバイダを `dnsv.jp` のまま使い、A レコードだけ Vercel に向ける。

### 必要なレコード

1. apex

```text
host: @
type: A
value: 76.76.21.21
```

2. www

```text
host: www
type: A
value: 76.76.21.21
```

## 反映後に確認すること

```bash
dig +short mybagpro.jp
dig +short www.mybagpro.jp
```

両方とも `76.76.21.21` になれば OK。

その後、Vercel で:

```bash
vercel domains inspect mybagpro.jp
vercel domains inspect www.mybagpro.jp
```

を実行して、警告が消えていることを確認する。

## そのあと

DNS が通ったら、最新 deployment に alias し直す。

例:

```bash
vercel alias set <latest-deployment>.vercel.app mybagpro.jp
vercel alias set <latest-deployment>.vercel.app www.mybagpro.jp
```

## 補足

- Vercel nameserver へ移管する方法もあるが、無料で急いで直すなら A レコード修正の方が早い
- `mybagpro.jp` が古い bundle を返す原因は、コードではなく DNS 側の向き先ズレであることが多い
