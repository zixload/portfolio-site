# PoC — CVE-2024-31497 : biais de nonce ECDSA dans PuTTY

**PuTTY < 0.81**, avril 2024. Découverte par Fabian Bäumer, Marcus Brinkmann et Jörg
Schwenk (Ruhr-Universität Bochum). C'est l'exemple parfait pour illustrer un principe
central en crypto : *une signature ECDSA ne fuit rien sur la clé privée — sauf si le
nonce est mal généré.*

## Le rappel : comment signe ECDSA

Pour signer un message de hash $h$ avec une clé privée $d$ sur une courbe d'ordre $n$ :

1. Tirer un nonce aléatoire $k \in [1, n-1]$, **secret, unique à chaque signature**.
2. Calculer le point $R = k \cdot G$, et poser $r = R_x \bmod n$.
3. Calculer $s = k^{-1}(h + r \, d) \bmod n$.

La signature est le couple $(r, s)$. Toute la sécurité du schéma repose sur le fait que
$k$ est indistinguable d'un uniforme sur $[1, n-1]$.

## Le bug

PuTTY dérivait $k$ de façon déterministe (RFC 6979-like) à partir d'un hash SHA-512 du
message et de la clé privée, mais **seulement pour les courbes ECDSA NIST**. Pour
`ecdsa-sha2-nistp521` en particulier, la réduction du hash 512 bits vers l'espace des
nonces (ordre $n$ sur 521 bits) était mal implémentée : les **9 premiers bits de $k$
étaient systématiquement nuls**.

Concrètement, au lieu d'un $k$ uniforme sur ~521 bits, PuTTY produisait un $k$ dans
$[0, 2^{512})$ — un biais minuscule en apparence, mais énorme du point de vue
cryptanalytique.

## Pourquoi un nonce biaisé casse tout

En réarrangeant l'équation de signature :

$$
k = s^{-1}(h + r\,d) \bmod n
$$

Pour deux signatures $(r_i, s_i, h_i)$ produites avec le même $d$, on peut écrire
chaque $k_i$ comme une fonction linéaire connue de $d$ :

$$
k_i = t_i \, d + u_i \bmod n, \qquad
t_i = r_i s_i^{-1} \bmod n, \quad
u_i = h_i s_i^{-1} \bmod n
$$

Si les $k_i$ étaient uniformes, cette relation ne sert à rien : $d$ reste indéterminé.
Mais si l'on **sait** que chaque $k_i$ est petit (ici, $< 2^{512}$ au lieu de
$\sim 2^{521}$), le système devient une instance du **Hidden Number Problem (HNP)** :
retrouver $d$ à partir de plusieurs équations linéaires modulo $n$ dont on connaît une
borne sur le reste. C'est résoluble par réduction de réseau (LLL / BKZ) — la même
famille d'attaque qui a cassé Minerva, LadderLeak, ou l'usage de PS3 ECDSA par Sony.

Dans le cas de PuTTY, les auteurs montrent qu'environ **58 signatures** suffisent à
reconstruire $d$ avec une probabilité proche de 1.

## Le PoC en pratique

Le scénario réaliste : un serveur SSH malveillant (ou un agent Pageant compromis)
collecte des dizaines de signatures d'authentification par clé publique NIST P-521
générées par le client PuTTY vulnérable, puis lance une réduction de réseau hors-ligne
pour extraire la clé privée. Aucune interaction supplémentaire avec la victime n'est
nécessaire une fois les signatures récoltées.

```text
1. Attaquant contrôle (ou usurpe) le serveur SSH cible
2. Le client PuTTY s'authentifie plusieurs dizaines de fois avec la même clé nistp521
3. Attaquant collecte les couples (r_i, s_i, h_i)
4. Construction du réseau HNP, réduction LLL/BKZ
5. Récupération de d → clé privée complète
```

Un détail qui compte : `ecdsa-sha2-nistp256` et `nistp384` étaient touchées avec un
biais plus petit (moins exploitable en pratique), et **Ed25519 n'était pas affecté du
tout** — sa génération de nonce ne dépend pas du même chemin de code.

## Le correctif

PuTTY 0.81 corrige la réduction du hash vers l'espace des nonces pour respecter
correctement RFC 6979 sur toutes les courbes. La leçon générale reste valable bien
au-delà de ce CVE : **en ECDSA, un nonce n'a pas besoin d'être révélé pour faire fuiter
la clé privée — juste légèrement prévisible.**

## Références

- Advisory officiel PuTTY : [chiark.greenend.org.uk/~sgtatham/putty/wishlist/vuln-p521-bias.html](https://www.chiark.greenend.org.uk/~sgtatham/putty/wishlist/vuln-p521-bias.html)
- NVD : [CVE-2024-31497](https://nvd.nist.gov/vuln/detail/CVE-2024-31497)
