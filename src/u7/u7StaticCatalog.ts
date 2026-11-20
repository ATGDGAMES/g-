import type { ArcadeCategory } from "../arcade/types";

export interface U7StaticCatalogItem {
  slug: string;
  title: string;
  category: Exclude<ArcadeCategory, "all" | "favorites">;
  rank: number;
  rawImgUrl: string;
  xmlUrl: string;
}

export const U7_STATIC_CATALOG: U7StaticCatalogItem[] = [
  {
    "slug": "survival-race",
    "title": "Race",
    "category": "driving",
    "rank": 1,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQeIjzigQfG3cqspUvZHzBoJF90u8u3WCTbelhFOE7nWGQNqvGezt8MTfTcV7-1r_U16a_rJEZ-OOaHz98GJXbfijqMUG0Dd2t_krGhtrUKCcNLci-UwkoTO5-dy4urpdKy3llwrRC8ATiRKuMSDREWisC6_u0HAJT4QSbvwpFG6ih7HMtmJW2iY7pWcZ8wfPT6lTuKXFH1jL1Qf1k24EdNWinbHWqT_5ZYW1MfI6Es=w1280",
    "xmlUrl": "https://cdn.jsdelivr.net/gh/events-files-manager/stles@1b4a1fc/1.xml"
  },
  {
    "slug": "flash-games/fortnite",
    "title": "GTA",
    "category": "driving",
    "rank": 2,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQdmKg5CBElgAMNMBfQTt5VmIj4KsFVSDZR3LXVxdwb_lk-VG-oEWZ3XSHKQiQ6wmt6b4DfOJAgul-jx8LVxJmZP5n-hlgy4jYILJxj_Mi0UZKq-C6Bf8jl-oj1kd29ckG7CcyPtuHn1JA8SKIZn7L2tYcPTyJWkwC3_DoTeIN_5G4r_oI-LCxfuUkuFd4YSAxKxjb1ix3qccvNkEMObtBzTk3x4QhoQiamu7mGrcb8=w1280",
    "xmlUrl": "https://cdn.jsdelivr.net/gh/events-files-manager/tag@a977401/js/fortnite.xml"
  },
  {
    "slug": "gta",
    "title": "GTA Vice City",
    "category": "driving",
    "rank": 3,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQdmKg5CBElgAMNMBfQTt5VmIj4KsFVSDZR3LXVxdwb_lk-VG-oEWZ3XSHKQiQ6wmt6b4DfOJAgul-jx8LVxJmZP5n-hlgy4jYILJxj_Mi0UZKq-C6Bf8jl-oj1kd29ckG7CcyPtuHn1JA8SKIZn7L2tYcPTyJWkwC3_DoTeIN_5G4r_oI-LCxfuUkuFd4YSAxKxjb1ix3qccvNkEMObtBzTk3x4QhoQiamu7mGrcb8=w1280",
    "xmlUrl": "https://cdn.jsdelivr.net/gh/ftbaldana/poklp@main/1-1.xml"
  },
  {
    "slug": "nitro-car",
    "title": "Nitro Car",
    "category": "driving",
    "rank": 4,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQdp6kibj9GQGTbEZLXdaAPoXCCHlB5xg0bnM-0gNRbOMxPIoyk2yeqDUrOvePYeqw-Z7YNGbdnYo7ZiiR9llKEN92Tb0TnK6nzlG0yzP-XsNtMk5lyHZhQ_DieQIJryiYYXUKdYTz7Q0SZPC4pALevApn2jhbzE562f4PRWMEXsk9fqTthBY6_TnWI1Zkj1BdYTPa4VNPtmHnNoeL0gQuk8NzfpJyfz1x6yKWY4S5g=w1280",
    "xmlUrl": "https://cdn.jsdelivr.net/gh/schoolflashx/cfgazfa@8d3e17cc67f79b5170ad099fd81201ade2184ad7/Images/2.xml"
  },
  {
    "slug": "driving-games/mad-pursuit",
    "title": "Mad Pursuit",
    "category": "driving",
    "rank": 5,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQcR7leUawonZIFr3Zs_j0EMeAru0awx82yuBY27WQ7zSFGG0LSb9QFLgvjjCcduTuTJLLqxoKZN-qdwACsVtImh8TigfFVs-8gWeeHsMzcO0VOoQ2OpqXGZXM-W5S9xkrbtdZSOYLudqx3BZQwKvrupCSA3jKXiihDsTwAJX2xTuXWnuTrG7SQ1OBgOxiFCkYRlnX9BIc7kXKpT-hZbNPDfudfMBQT4l-Y5LQHm4Ck=w1280",
    "xmlUrl": "https://cdn.jsdelivr.net/gh/777kze777/zeha67@main/3.xml"
  },
  {
    "slug": "new-games/level-67",
    "title": "Level 67",
    "category": "skill",
    "rank": 6,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQdawNN8RLH19VNEvYOOe6o_59NNywycYx2RTXr4RJoi7YI6zjciQYsbc_aZ87a6dHZEArumCPTQwfnhxB86JS9nGGSEvImfTTYZ5rGohaciF7Qjr3sldMJbAhs81gFXxofdrFhZbcp7k-ZYJz6mqTDKFdsqyP3u5LqD-_43Y_YsQoJWYFtmQPRWdr0-582B5h_-pRL4qcLQwAqM68aiv0A0qtCGBoV1aUxiCvoihgM=w1280",
    "xmlUrl": "https://cdn.jsdelivr.net/npm/nxd-xm-1@1.0.1/s6.xml"
  },
  {
    "slug": "renny",
    "title": "Granny",
    "category": "action",
    "rank": 7,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQfUF2YtrKp6irJicachaVrAqOiB6Z6rta1ePpeHteV_PZZEeT5IE5AmYWHDkveFdI8ze8cz7Aiaq26I32NduEZelZdqQw-ZuDhOHdE8DOHsWM1kDalWmtnRUcdm7gQvbZC_6MGDxP2jBqIqDvWX83oy0flcyeDUoYVFQ6gKO943tWwLFsSt3n5F5cjnbfBk7t5rQUPRo81sXs3dawqQMK7SAFF0K6gQv7cAerNgCjQ=w1280",
    "xmlUrl": "https://cdn.jsdelivr.net/gh/ftbaldana/qwez@32b0c0f/1.xml"
  },
  {
    "slug": "snow-rider",
    "title": "Snow Rider",
    "category": "sports",
    "rank": 8,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQdjAFH5NC-nNW6ESX8DCak6kIe4kVDwXWDkoflIeFA7nE68lWEQdeaDBG5ql912xYlB-U2rdO-NFuDtcZ3ohXPRdkhZeaRNwB6Q0LcqC6bFO1IZ260K2--8ZalB502g1FFJUettwGlwpc9kM0FVc_8zCOJyq1G5mBQXSUQW6I2eo_smv78tHSqmF6Esd0I_rH_ta2LezR2R7dxfftkJIibSIr9TMWyPc4vA8wBxkRk=w1280",
    "xmlUrl": "https://cdn.jsdelivr.net/gh/nihathatpsin/a-b-ce@main/78.xml"
  },
  {
    "slug": "football-bros",
    "title": "Football Bros",
    "category": "sports",
    "rank": 9,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQcfRll4FZ48SlFp7gFkH9Ej40MZkM_DdCJMrMdKzg9K9DLs9FehXCH8vNCYy503M631TimzqCubK_fToMFQDi5PceRtC_uyLgIBhUQ1ZEY7ffeUbVAci6Xvo9ceworuILkVFUOuFQodlKRWWf2JdjA7YKpq4d_oDnbZggLXRjVQjucquEsP2RJg4gXVoU_r_NIvC68RJC3wNOC9nLrPzncjOf83_EUd8WBYCBnItlY=w1280",
    "xmlUrl": "https://cdn.jsdelivr.net/gh/z799gs/550o8@main/Build/1.xml"
  },
  {
    "slug": "table-tennis-tour",
    "title": "Table Tennis Tour",
    "category": "sports",
    "rank": 10,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQfHjDZZnc9KlsSacoXKGJp9-BBua7pMaaNY6I1gpg-lSBg4tp_-W0ibOnE5hL9UAgugeHPGrYoLx3OOABVgzDXupfdWXS-mI3ngeAZ_9LgLBokQw1PDKzuiFWhIlfrZQdL4woxTlipffwel_nBR3_R7gUGaMxyY3C9hpzCGGu4ZTPIIZEt4uoi3bbIMAoJbrvjk8XQp5AQ7LsDfCHeDiBJhP29BtXc-KzZ_fuO1fQM=w1280",
    "xmlUrl": "https://cdn.jsdelivr.net/gh/teamschoolcomu/school-file@94ae69c2730ac00f3c17ee4a8973bd6eebd473be/1.xml"
  },
  {
    "slug": "football-aim",
    "title": "Football Aim",
    "category": "sports",
    "rank": 11,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQf_yALXZdOgnH8kure201Ta8fdqBOqRj2I9Apf2000i0tNXM_5iIhlrZZT924b0G9VpTTE3c2FLRIJy7dddoN9TBp3CT9sFtVOSHuTelFZlU1lISeQPbftaDh7sdyd584YhNPrTrm1juf-9vWLYv20-tAhrDSY8cmaOWbrhcTYYZzIGfKC2fIszCYyhhw9Zba9Rg1Nx-CqblfUAK-OKAvNYSSUBt3-ii-AgDFUzkqo=w1280",
    "xmlUrl": "https://cdn.jsdelivr.net/gh/unbilgicox/zambi@main/a.xml"
  },
  {
    "slug": "new-games/goalkeeper-3d",
    "title": "Goalkeeper 3D",
    "category": "sports",
    "rank": 12,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQciyYY8VlF8lcIRZqCoJOS7YMvkt__63Hfi-Os9EYAmASOAfLDI_TWaHByZPio2X93-Q1pmnaky066yuHvJopl8Z8bqx9iB4q2Bg8JAEB1lONVzrglfcj6Ty6no7xGE-t_7E5DdaISrcPZOv1FraVwcued09vVclqSZEQGuwFCkp3WUwRpTYFkrg6IK1F9RI5C-dObIFET2z247p54ElYoouzOPgQvObvtKrrU0G2A=w1280",
    "xmlUrl": "https://cdn.jsdelivr.net/gh/schoolflashx/cfgazfa@main/1.xml"
  },
  {
    "slug": "basket-random",
    "title": "Basket Random",
    "category": "sports",
    "rank": 13,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQdXIk3UhbEVk8qQvHFoRokZddU96NbRYZJM5QEWzmF-iL3bM6Lx69cyKUv2ey2SuZPp2SKCBdLPWBlg6Xdcfm17ZRSGYo0FzykkJQ0izp_TxJoXYOPUZXazSWEu5DESN82AoEXF5HcqKl5a-R-Lpu03uQZ2cQ8Sm9zZw6EiXeIUO5FlYKAzJV45DUq068m15YUk0qzJD9z7i0nX0pMI4azZbhmFQrloN1KKQeDBU7c=w1280",
    "xmlUrl": "https://cdn.jsdelivr.net/gh/ragdoi-archers/ishere@main/basrand.xml"
  },
  {
    "slug": "dune-dash",
    "title": "Dune Dash",
    "category": "skill",
    "rank": 14,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQf546KVOunFw4nGGc4XG0T1tYxp-4NW1PiWrVTjclDF5laLVOPar0S2ZBdGHaYnLZMIIwHXaIj5v6CQOyD44DTGsa6kB6iMeNbKD4GEqYmeR9rupW78fx8mbIv40aGs8cpGFbYF-qEtHIfL9GY1u_W3QEjQvHiF5SDEeJLTlDLmkWQ3-mb8ICS4RBKEQ59itUBL4rPjpUB1ARPU1upgj41lEL2XiGic5BIAX2vkcOE=w1280",
    "xmlUrl": "https://cdn.jsdelivr.net/gh/z799gs/550o8@main/Images/3.xml"
  },
  {
    "slug": "basket-bros-27",
    "title": "Basket Bros 27",
    "category": "sports",
    "rank": 15,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQedF_nhyzPQ2GM_cq3feq7plel2w9WxKJjlMxQJ7wzSl0wnpgafhaPqbWm6akcG7JzsPVF71_0RfE3SwlEnhoEwt9YifJN78DfuPisB0sGqa_sZNeUowht8vsXywNryqpoRGMcDq69APH-1yXbNM-kK41JBFUnskoew1KO5kDCNVQ01mC4gxiefK0oRCleMD3RKUjvvuXhxacZpouRTqS_an7ddGaAHE8KgeyM6zrw=w1280",
    "xmlUrl": "https://cdn.jsdelivr.net/gh/testamalame/100vs@main/saf.xml"
  },
  {
    "slug": "death-run",
    "title": "Death Run",
    "category": "skill",
    "rank": 16,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQdN-1ZeC5oMPE_uJL3VLNOYCl1GRSix2dz9mex60PgC5yOgAM2DI8HJ6Cp-q4LqKD2S3z3AheYjvpg6uDQc9NJqX1nxW32BthFPGEs87YzSENhwAgyb7o0ARXM3m2Uvi8Z-mWaGG9za80Dgcihc08hBKS0tzLHvmmEuwjDhNJyUJtwXNwJSHcmO13rLdI2Z4EOC0d3L76vk197T9WWf56TXH8ccv52SAe--LW66c5E=w1280",
    "xmlUrl": "https://cdn.jsdelivr.net/gh/centerclassroom/mc55@main/det.xml"
  },
  {
    "slug": "maggar-io",
    "title": "Maggar Io",
    "category": "skill",
    "rank": 17,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQcVYM76rjJ3QBn6eZjUNXdRMvfKuhbdtGSQ1wB3GbZxbf9v2-aCf3RVwtMpAje4IYQZyj-S7EHE3s9NO8Gb_fN7stEx3mmQJc43-E2MNIGgeZqDQgXKNbqJUqXLLTO15f5zKe1fJndaBlx1z_PIYjqE5nq0xERRFw54XiqfZGDV9IuJZsJtelU-lWTx_9vI0tyV37eLC83kAUwtOFmOkXXf30RHfZjszJKXgRKT=w1280",
    "xmlUrl": "https://cdn.jsdelivr.net/gh/createzalma6z/maggar@ff311cf/1.xml"
  },
  {
    "slug": "driving-games/unreal-drift",
    "title": "Unreal Drift",
    "category": "driving",
    "rank": 18,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQfodLjpUf7x3nWquWImMILHgBfHMykElKBcqDGOY9h7nC6eXkNEnrJgF0WX1PQcbEePWw4bFLI8dbgsRN4DIG8hGnZBJItXv_mHEeVCXk5Qji1AcrkAB9tNSu2CIL9_c_o9Ke9dOHLAewplCgtHLImvnzPnzoXtDIW8wc98N1Q3Rs-SduJxuZaRfmgVMMB5eHD9BsvMrub74fKm0yR-Vo2yzJS3i8NjAXjxoJW1wbg=w1280",
    "xmlUrl": "https://cdn.jsdelivr.net/gh/bodrumkat/hanhar@main/1.xml"
  },
  {
    "slug": "ragdoll-freefall",
    "title": "Ragdoll Freefall",
    "category": "skill",
    "rank": 19,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQfk3e0Di9_qbYn29_kdrfDO2bw5bayoAsibNz3OEMaBXVtmYZTVVDuGpqkaBuiDjS1ALNULNgJObs-uNBT_LfbaD6zPXFRZq_Hqm-CxRs5nuTnvIxvWv0HFwbMJjUL3lYbASyi89yV85BBjCqDBVTeXIrV64OmAjoZZMZ9acdffffQvBiY76RgtDChE4oCKIKCJB53hJSGjJblm9g1BDL2QsoQ2cjbVnfIkgw19Ecs=w1280",
    "xmlUrl": "https://cdn.jsdelivr.net/npm/nxd-xm-1@1.0.2/r8.xml"
  },
  {
    "slug": "gunspin",
    "title": "Gunspin",
    "category": "action",
    "rank": 20,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQc-2jchklWnTM42JkxgmqwHdX7AdciBiab5BsPJiVV_nUeMAXMZwjJcp8wHEDPJh_uUGZ9iZUOFS4jLo8mwxqdXdaE8EEJKEGiABRjYZN3ygw-a91GyfeJnCQIbSVM2rFXkGVKBD3c7ZFKo6yVxCkUh3qStzW_8Ybm-uaOdix55APSzD-ZFrS65-mpNiKzzUzax5JeOUT_yUorBTUy3jmXXrINs8Cv_88VBpsUN_6w=w1280",
    "xmlUrl": "https://cdn.jsdelivr.net/gh/gru6nny/ohd@main/qadd.xml"
  },
  {
    "slug": "archers",
    "title": "Archers",
    "category": "skill",
    "rank": 21,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQcM5ixWChYnAgorQhf3hgYGUoK60ieXcV4GVQGUbc84CwSvGBmPCDSyRzrEj4jIKLZ6WgJ47A8PP7Z-S7D2Ku1ybcv99GAWVnKRK6Gzk2O-niiWBz0KMegsauhGLGPX-ikTPg77kAXPkBgmYv0u299Z4YuXNbcTQT9KG4XjlbkZH2FIahomy-Tn_drOHXQi3KvNij5qFpXwbxYivcLTUPomy141bobKYfyCgx8cfa0=w1280",
    "xmlUrl": "https://cdn.jsdelivr.net/gh/ertemr33/qaza@main/1.xml"
  },
  {
    "slug": "new-games/jump-or-fall",
    "title": "Jump or Fall",
    "category": "skill",
    "rank": 22,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQcLKZp3smXvMwbKVsZ6VgzgOcKu6w6S59uZ9be85P6sKT-Il3aOCMR6Ey3vmuo9AmKjKi410XhwXorasoHxXQvDWCDtKimUXilvh-WdcHdtd661738PJb2aVZhr_E2BTCx5fHPII_8HJq23IJOl6LBltl9o-O44IyGbzSgxYSex1tQi4ws_H51rBAErtV06uTT2u-ZCGUPydJTNeFAVh6CrDaC2Y53F4axd-Rpd_K0=w1280",
    "xmlUrl": "https://cdn.jsdelivr.net/gh/classroomusers/77u6666@8142074/2.xml"
  },
  {
    "slug": "new-games/slither-io-2",
    "title": "Slither.io 2",
    "category": "skill",
    "rank": 23,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQdrAFRBuh2nHPz3iwKpLuVaOfjiTtfSszXeyQZZHEbsHhX0fq8v9vjz_jVHyTLr-x0qioTs4kEaGY2sfXUY4dE918x6GfdyMnkidpb59pDJCrSdZH63GVNqgkuLuup7lhMvYUeXZ4nwX1SKOKkBukHu1saw32RIBRdCCiXhmfpWqjbu-Nn5ney4qfUtzhnPVuCPWCDgWyHUXIQxB7SASWayRywNCPJGjGTAcXHT=w1280",
    "xmlUrl": "https://cdn.jsdelivr.net/gh/kelsimsk/wahx@main/2.xml"
  },
  {
    "slug": "spiral-roll",
    "title": "Spiral Roll",
    "category": "skill",
    "rank": 24,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQfQVE3K0K9iIsV8W5N444DmLzmXxTcUmdZBL5uY1iaK9eRkfbS6UvZPaXeIbzxQpYLhVA9E11CzjPW9lah40bC5yH7lOeEPpf5yIBWbadBJTHKx5FAX22DQGQXFreUzcMzZI7zB9pfvz7r099So7S6bcj50gYuSN_gOgvwD1imqSLrUEd12n8_-NkztEcWlOmEpVWbsq6FY5FBlcB-kOUovZSVz_3Q677OQrT74vMQ=w1280",
    "xmlUrl": "https://cdn.jsdelivr.net/gh/99-classroom/kol@main/spiral-roll.xml"
  },
  {
    "slug": "moto-x3m-winter",
    "title": "Moto X3M Winter",
    "category": "driving",
    "rank": 25,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQe-FwgOjhPuyCUDW9CVWRGuUuSRxHsSZ164Nzh52b3RWKxYhE2oadfeEz_LyZCvFITBdg0eqZfyWHoySAeMabyD5w_MQV90bV7YW6uNQdrQSmDFS-BRBIQHOFo3BAy5b3fWJM9I7rAc_rPcZPneheb98k7rZrYnyOmtv1i0E4Tpl6KgrFo0CqiTJMRHDysS_lrVzUX4PhhkBV_JS5mZuZGPyxQUDw3bUkl1iBld=w1280",
    "xmlUrl": "https://cdn.jsdelivr.net/gh/bodrumkat/hardes1@main/1.xml"
  },
  {
    "slug": "only-up",
    "title": "Only Up!",
    "category": "skill",
    "rank": 26,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQdovfMnz5tAGrA36_8ohlXqZNsV14aFlfBgRmLPnJpSN9YrUd9r4l5gDF2cg8ztDpjTQ2kI-I1BdjXXHftj3U73a_hrBdh8H8WrBQ4YHCZcY62ECrWy1EQDcfp28Tof4qzgnx5k6yiX57QLMMSyHSbfz_oVrf7ltd-DtutQaqE0ZqHdE3zbpkSN50l_tGkP7rY-1kec7XaqeMT2q1p5fRK0NJY0hc016PHauB_Jjho=w1280",
    "xmlUrl": "https://cdn.jsdelivr.net/gh/gulamen/gulax7@main/2up.xml"
  },
  {
    "slug": "knife-hit",
    "title": "Knife Hit",
    "category": "skill",
    "rank": 27,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQcz8Rf6XzbHMoxkW0w1Il-rXuA-s7eTK5HKQZllNPxpcSu_TPhN606XBuviYc5SmhEa1CJbqz7zeVyKXz4LZumjKAhcmeUlRb3j_4n9OPOaN8zSCOwOafdWfoLZ2YOB_Dbnai-zmX3xcan4ai1QQc8VIqU8l_wvsQt5TlSIzjtuWzVJbonDoc3WhPyNnMUNgFfjVa78MnYx_Q8pLVFX5zEQ_lW0a2eOyJRsFP9G7w0=w1280",
    "xmlUrl": "https://cdn.jsdelivr.net/gh/ftbaldana/zon@main/1.xml"
  },
  {
    "slug": "paper-io-2",
    "title": "Paper.io 2",
    "category": "skill",
    "rank": 28,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQcE8f0QD3bPcVsksx6S4ob3kXtmi48V0Px7VruOOmcr30bWSBotQzBSvvoKM8qc2OvvJdKCmmt3iUMESPx-GRdgeGlsSkc9_VWwf-J2iMbgtO-THaCu4ReJh6hykydPwMnWfEjrfXb3qpu4gY7TQTz4tPm3jhGIftq56srwF4QfUe8M7Xje6aUSCjRjqrmFDps4OfDV11JzrcSt3h4-zhhvQ98b6CZzpktThQbb=w1280",
    "xmlUrl": "https://cdn.jsdelivr.net/gh/centerclassroom/mc55@main/paper-io-2.xml"
  },
  {
    "slug": "stick-archers-battle_1",
    "title": "Stick Archers Battle",
    "category": "skill",
    "rank": 29,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQdnL0G7BUbQqC1rSC0V7QzglUtt2hX8SXZvVN2IqkWtqSkuFmb378IwiAxQHjLBInPXGXAaJeR2ovUrAgDW3X3FPVqVfXBzFvDkAmvV3uOI9nmMmraEMndb600mC_U4x_uBj20Ji5et2CKsj-iJH2O1vYJp7_hFH7Py7VYx1hN8s1Y4QRV_EE8NeE6ihoAMgG3S7-vejZmI5djH8NeInw87kZtiX0nehIPyeUku=w1280",
    "xmlUrl": "https://cdn.jsdelivr.net/gh/tyuuunicorn/cdn@51e4866/1.xml"
  },
  {
    "slug": "new-games/rooftop-run",
    "title": "Rooftop Run",
    "category": "skill",
    "rank": 30,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQfF0ZxN6WLlFfXonHfPGNp7d7w0puW1Luv6ZOAw5dn8kbcCWdm_MAvFOTPTARunkV43VyvEvsjufbeYdtsiVDjq5S_QTHyf2toaN1b2jdsZ23Yx4JKjzIJ731LGJ8rhk2tmYw_aRWsnZ37nGioOsT7EE_zFkvu-ixsCqO9oeRUGI4hKS2SuSGS0gThD7QlZ9wQZa5E49mvBjQNaoZz1wDMjb2xUGuIOFIs-YU55SWI=w1280",
    "xmlUrl": "https://cdn.jsdelivr.net/gh/z799gs/99@main/3.xml"
  },
  {
    "slug": "new-games/flippers",
    "title": "Back Flippers",
    "category": "skill",
    "rank": 31,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQduAOxFdWDZwBUdRm-Oc1v2S7fVnsmVG3pipIhZMmlOpORtHZSk9gj_ZksgSQnaxteL5DQw6Sd5MIWDc-TgY8ka2mcWhMa1CSeOQXkiYVdVcdmd5zs5Z6ASKB6GQVlgyU-0nt1dfiK4OZP3Y1wIQdAwYit0-ml1KLAUGBJyWZdBBKL7V5vk0gx11rI1IcB4qU8J21krTaoDVYUiJep5e632_dZOAq3tO-0z6vwq=w1280",
    "xmlUrl": "https://cdn.jsdelivr.net/gh/emrsdahclassroom/zefli77@main/1.xml"
  },
  {
    "slug": "ks2-teams",
    "title": "Ks2 Teams",
    "category": "skill",
    "rank": 32,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQftag_Riz_m4AvG863X0XeXKPNakdoO2tLn1OjCKfSahkt3hEuuaqTEWEk831gaJWUChDUA-PDrJXkzyfcYJ2xDX1rq1fxduii5yxPwDitdvGPW1XP8vlFwevXAnw86Ekpgfkk8N7_pUs3fadWQ6miKoO6gOnlSQI1sM9OVOqCVyP1CKTEXQutGhTaOf0QSp7a1N6MyUSCztiV025ee6VjLuEas7XYuU2FXnftAgCE=w1280",
    "xmlUrl": "https://cdn.jsdelivr.net/gh/z799gs/c2@main/11.xml"
  },
  {
    "slug": "real-kart",
    "title": "Real Kart",
    "category": "skill",
    "rank": 33,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQcYkeRKkg00L2yZ4bq_2cgj4wZFUWt5UD_Q4dtmqvUmbPvppV3s3sJGDnPzSAt1iCAp8d3EQpywxwBXuLOlALF2RnZlIKc6i-QcaPCcg5kqgxfHthIs6uN6puMdEBGn2VTaoJyZgjUE2kgIB_zwnp_mnJP5aXQuQ9oZG4XY2Ww0jjO4lEBkseplJe3LBlMSdfKvOElyfkKfVbLeBDX-XWwAuq1dv3tsn6R7g0Vozy0=w1280",
    "xmlUrl": "https://cdn.jsdelivr.net/gh/docs-g-classroommyflies/real-99-c@main/2.xml"
  },
  {
    "slug": "new-games/vavex",
    "title": "Wavex",
    "category": "skill",
    "rank": 34,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQfGy_p_gasI67ixLPWd_Yy2WpfTU7GT1M6phaiCT_E9TUGBl7NwrBebRZPvKPweoLsGseA-0OGs1qwmfo6KjCv7kN9yO3OA5WXdoCfvf78sPcvY3WmHdEMuSmfvy61t3speoYK_YY1PYhTqu7kZlUIOF6z9ojQ4sNr41qIbalG_h8-aZucEtoLeeoWzvIXVxBYOzd74MoXOcQqnT4yzu09stVHDLlvBwF46dKIj=w1280",
    "xmlUrl": "https://cdn.jsdelivr.net/gh/netclassroom/felek@main/wwavw.xml"
  },
  {
    "slug": "new-games/meme-tash",
    "title": "Meme: Tash",
    "category": "skill",
    "rank": 35,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQdEPwH1-71RNKTp_E3K-DRrgCrLv__xgiYIFDyFun3Hcd9s3H7bC-mrxj8JEBL0eNkJrU5Pi8JB7HazgYLTuBQQIDQSzhCcbIwDifPcXm82WFJNtht36SqkTJ9CEaAN198AY9MFXWF8guQUlaotcm4l5C3_ECEJXZnuNv18591y9c0SGhHWKnCAR0oR6v2Eed6JOXH3iI_lcFEiEIil77wk8xVUdCT2Ju1bBCmp92I=w1280",
    "xmlUrl": "https://cdn.jsdelivr.net/gh/ftbaldana/su55s@main/2.xml"
  },
  {
    "slug": "truck-simulator",
    "title": "Truck Simulator",
    "category": "driving",
    "rank": 36,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQey1Fsleja9vmKyQCxzODPqBj8-oGBKbBxVAoqenfoKjKhJQ8rWQ8kQ18-J1ybTV8AWmtkQTgvjSv6-2mBLXfkhsdWqilsR5f-1-9nrgbMfpQI7aJk0bg0gKvZmr6MB6-qDn4aluBFoRG4FHwrYFl-Y_7V9q9WgyDFJz0AYCsNg7PmxFjF8Z7mMRX8yxBnCPbsa9fTNHj6psUM_-_aOUipjItB7YQc554czQRcDIbc=w1280",
    "xmlUrl": "https://cdn.jsdelivr.net/gh/createzalma6z/seyya774@main/32.xml"
  },
  {
    "slug": "flip-rush",
    "title": "Flip Rush",
    "category": "skill",
    "rank": 37,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQeY14kiH7t-mWl-BowMatV96TXU_h_w6EIJrCuLLWhQaMq_HGprKEr_RsPMl0gTOtB3OyB9_oZ0cq1uvqsRLObLJdqippEViw74eYte2yU3Hy5YPaVn-QOEk5FRTHpUsvSjQJRKgAaDqRGLW2QKYTmlEJd9eejvTG7v8I6Lx7NLZB7l8a1IpiwgwHdUhCX1W7ey764hSWQpS1Qxh_pbov5Lo6WybFTksoDJSZQQXeU=w1280",
    "xmlUrl": ""
  },
  {
    "slug": "basketball-stars",
    "title": "Basketball Starts",
    "category": "sports",
    "rank": 38,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQf2wifhLVa-GXiYKmXjJ_P8Uxe9eKYli5Pl3DhN46_pIh1POtoUhV3bWj-_QHmvcZqPfl_QcztjRCqCgDaZRxyz0iToRQ2gCsTIKYKgBLYMlLhYG2MNQ_lghxQxFy_qVkbKbIOlo0eS4uG5ctYrDOuRfQBJ7asw1TDi6gHJxc3mQClo0muiQHITxCDs9C7YcRvGS0z8-03qcoGehqGwEKK1cGaOXbzg1Fuut0VQv-M=w1280",
    "xmlUrl": "https://cdn.jsdelivr.net/gh/schoolflashx/bilbilu@main/bs.xml"
  },
  {
    "slug": "soccer-random",
    "title": "Soccer Random",
    "category": "sports",
    "rank": 39,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQd1fQrVkLlHluucovKuQXd8CrKmxwfhutMpKkq7zjE62rcX4XmLvqZ0LXkZz4lbYOx0zzafEdlQHO3hD0FautRujfat9vXrv3RFaiZTv759Hi8oZZ1KjDeUD7Sv8lr_5xyl8j-ohZhcPMV-oBTPoAGmFboZFSCdEdBVzR4VsOsoniu5feYhTd4w7RbKhUDB11Daxj6u1Ft5tNrmz64QaCJUg16ncsHP6n27PuLec4A=w1280",
    "xmlUrl": "https://cdn.jsdelivr.net/gh/awaiblecomponent/ss65@main/soc.xml"
  },
  {
    "slug": "volley-random",
    "title": "Volley Random",
    "category": "sports",
    "rank": 40,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQfYsplrk7S22kG32FwHmrkwQFmo2t3PXJb1tTRpjrFJmatdW983v9Ylj79fP7dZMc7HbZLCLm0Nkp8hXGvOKy65OGd4BonSQJvW7CWJaZd-SHMQW8AWheX2dFixu8Ef_g1c65xlN857GmZzg_AHLSqHE36d72Pt1xdGs_z4ZdHhBC-6IR_CDqDAm2ualX1SIl9FFCMWeBU3lfsycHn7SdGqFCwK4BYkn5TtPkjn9vc=w1280",
    "xmlUrl": ""
  },
  {
    "slug": "boxing-random",
    "title": "Boxing Random",
    "category": "sports",
    "rank": 41,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQc8riPWHFk6Ie44KHGsE7MZ-4UrWXTwHVijlY_RZbQbVNaV39k8Ll663BYFRlAqtg82Mj2KttXoSXKYb1WubOvXDdWYFi8MRsruhBPYkDehroRFtA6KYHBLMpBG7XBp0igBpKsgt6voMjHyTNlAHNa4YnljKdCmB7IcfqdzeLB0qLchGWHqrCxnf0E7mij1dM4D_U3yfbrWER9vGxffEb8j-DK5gu0_q0aqgMpz=w1280",
    "xmlUrl": ""
  },
  {
    "slug": "new-games/leave-2-escape-from-prison",
    "title": "Leave 2 Escape From Prison",
    "category": "action",
    "rank": 42,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQc_dqhNvwcQ6CIMbo68XfAfHu5AOdP8dIkQdORfAcPwvXvvnCw9ANgyj9APBwcVjvMczPCZOxXQz_QlgR70-JQnqry76JQj4O3F5bwWT6hTM8Hv_AD0_T23ugSSO-c900l7wtNMs_rrx9touFhmPun1tdBOoAU-dn-jHqMfQcsUmyw3ShvxcEqe35t4x1gor7tsR19lpZ6pI3QQXi0TwE2OjyxNEj0Rl3dEifWjvGY=w1280",
    "xmlUrl": "https://cdn.jsdelivr.net/gh/tsubasamasa/64x74@df71672/1.xml"
  },
  {
    "slug": "real-pool-3d",
    "title": "Real Pool 3D",
    "category": "sports",
    "rank": 43,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQfGfKuUO9bBhnU8kaiFilr6yEHu_mwkA8PcaRXZxcVxEGC5N4j8b20wK4fCMCJ_aYASX355iqQLJo9rmKiY06h7AIIJ6HAdRHqsk16oaJO4c10ZNCs6rLu1bhjYwgJVi3Fo7ZXiXpeKqkLmilcCDyDhpLwWy-MoS2hDMrVrtS41tbuLvcKkNPeLFGjQSR8bhml9iJOpdmAHpJ_tV4cKDPT8UAQY7o3NW510WgG0=w1280",
    "xmlUrl": "https://cdn.jsdelivr.net/gh/z799gs/8poo@main/1.xml"
  },
  {
    "slug": "red-vs-blue-4",
    "title": "Red vs Blue 4",
    "category": "skill",
    "rank": 44,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQcOWKiddyel7FxoHKqj2l3FminKGR9Y6nC22IuLUGI4857OVXE-aUDP6MxH9lMMmcmuePAcay4eU2-ylpuD3XXbmmAe4s1pavvM-D3-A3bXN9Z-zPqtvlxHfFZdvA2WpN7V_59_g8Q-qUnzlAulrwN5-RvM9a3wNstpRwZFBviWTVpYrrczCdnlRtlZoIQmBLi0QX0ldnrwzgbqRPaePqrIHc2RRha2HNKmsC70W1s=w1280",
    "xmlUrl": "https://cdn.jsdelivr.net/gh/unbilgicox/raven@main/1.xml"
  },
  {
    "slug": "cs-1-6",
    "title": "CS 1.6",
    "category": "action",
    "rank": 45,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQeKCwOj5zAPwymkSL_57R2gAklw2NU4f5ske1qfpj9HboKeDcFsnHZcHN0yW1sZjbSg7aZ9uytyxvhnAdCyNEVzqurwiVJJc7bda13JTZoh2u-2KHVgFAU1r-IQZlFpD1ZbtoqfMaInJAwumvCLnHc-XGaoDKefL3Iv9faGjSLZKj5NKyksRkwd1jO_ZBySregSiD1dwJmHNkUUnRmhiY4LrI7m-FsRH91Lr4zF=w1280",
    "xmlUrl": "https://cdn.jsdelivr.net/gh/familiapablo/lopx@main/cs.xml"
  },
  {
    "slug": "dig-out-of-prison",
    "title": "Dig out of Prison",
    "category": "skill",
    "rank": 46,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQfE-6VbmFsItYlghOnRxv0sRYtC7MGfulnraQwLXuix_zb71AMrYlKzhGG4ZL__VmwutFWGp6NZ78v4ufVXZs2q357HkQYZL-xfQpotyMIPMYh4ye5oxTT6BgRSaIX_iBt_hAiFoS2jJ6ITBhdGkC3m-I1HzhM47vwaKhnqLB1kNZ-8CRH62hreGaqFWUVLoQUz61EoffSFTwSoZSk8JNPDw9bgZcemUe7iGG1PV8o=w1280",
    "xmlUrl": "https://cdn.jsdelivr.net/gh/ftbaldana/zubli@10ff9d1/4.xml"
  },
  {
    "slug": "war-the-knights",
    "title": "War the Knights",
    "category": "action",
    "rank": 47,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQeOADp8nbC_z1oWLzR08NCO0QTp3hfy6U-Nqg-DXJ1J6LKK0SwcoEWMrUToCgSLU20c6tfrCOY7VOpfWrIyMj063EWt09O299A2oF583fWfb2PeMJPm9v57mEnjBTttn8SMbCSbrc1_CRzeHqNeDE_9mECV7t8zVplp9vLfC2iz99fIWrfHPv2ixqDH3mYx1Q3C3jI19-QkTvnOMbdA_Yam3ij5gumBN1rcTWomR-k=w1280",
    "xmlUrl": "https://cdn.jsdelivr.net/gh/papamamia/70099@main/warrr.xml"
  },
  {
    "slug": "car-vs-police",
    "title": "Car vs Police!",
    "category": "driving",
    "rank": 48,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQfE8MKG3QcxpFtU9sWwG05HNlZ1CuopsRKnwKeZGbK_iD-xVHAnWYoVpzqHw-Pg-shn2BhPYpWI_JC8fvnEI5UW5V5su4NTx2ddcL3fZ5A-JT2TEp0uq4O45PXmZzodVwqMXj3DDmqRTsgAJh4WuG__8EkLmwzaOKaPfZIhPBD-B9PDvFlWTxdo1zNegwbLmGx13AvvUanQ0YG3C8sNFs4dXeZsnW6A-FTRCRtvtYU=w1280",
    "xmlUrl": "https://cdn.jsdelivr.net/gh/emrsdahclassroom/x7gy7@main/2.xml"
  },
  {
    "slug": "ultrapin",
    "title": "Ultrakill",
    "category": "skill",
    "rank": 49,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQd1Kf703FHm-f32zWaAXYzHPQpQgU_-fTBlRvUoEo4pdBbdDfdxIlcoiHx5o335AziOV_PJRcrJte3nLWzn2xBjTxrrlxIEz_uw7hu-IdGOBF9hcQz97UiBgMH1R7WeRsFV_kumaYp9nvNXhAtAajhvmLJ3ztw4jH7T9jIdUmDtU0GAln38w-HsCMswtNSdPRa95-I3KdllSRByKdfMRjurzWasa0kedxiy_wO8ccc=w1280",
    "xmlUrl": "https://cdn.jsdelivr.net/gh/kelsimsk/ugil@main/2.xml"
  },
  {
    "slug": "new-games/jetfighter-simulator",
    "title": "JetFigh Simulator",
    "category": "action",
    "rank": 50,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQc8jU7b5wIC9Ul0RwXZnpL4ulC2zse1ZZbSTQFkbrpkQlrpd9K9_Dq3VZvu5cJqqaGMmJBjykAGDu1mnGDsxJ05vpK9xozXd85r5kqqK79rNu2yH77Z2PmzPTu51AwtueMsWRxcYYq8CwU4GoiSd_JyEJZhAHVrymNXhs7OETBdemU0_B_vqrj6vqp1jBbwHEAH0tfJIlSnacrZXp0O45tECuXc3F6cSy1iw-B-_nA=w1280",
    "xmlUrl": "https://cdn.jsdelivr.net/gh/unbilgicox/google-classroom@main/x/u.xml"
  },
  {
    "slug": "chicken-royale",
    "title": "Chicken Royale",
    "category": "skill",
    "rank": 51,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQegiLcEOqiH8JJ27WCrF_uKw0sWrM2ydhDHptw6tiHQ-tpacsFuY7KcB-UlnF0amQYDrkcWSlNPTXZv_JNr0AFjNbJizR3H8pvDDrvexxHHc-pNvbLdq2NO3_ul55s2OOZ-iYjNHSz_f86KLOD6IPZDThvFUash8BwVC8myyuPOKHHaoHIdBBfRVoc8mkw4z-2x5XSn4F8s-dThO7gIU0jZNga877AKuP2mKQ=w1280",
    "xmlUrl": "https://cdn.jsdelivr.net/gh/docs-g-classroommyflies/zalman@main/1.xml"
  },
  {
    "slug": "supermarket-simulator",
    "title": "Supermarket Sim",
    "category": "skill",
    "rank": 52,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQdL1-aoBtBuAbF9MCR5wrid-v_oDpSwV8B9Z9PmnBwiHUVIpwUkiBovCVtQtS7FKAtMzJsaZS2dKaP6irH9a6JHw1IuRh3Cuh2n-e2hL5MZsiXtqBrpmbPPPsK60VT16h8M7WUNvmYmKNweMmNUEObMSGsMq5RYE8IyfYU1BMacrJrwgMUsIOXwWiEPydGOQqBroL1noAq4Eqgn7bJNg7d-kYntIniMwaj4RD4zODc=w1280",
    "xmlUrl": "https://cdn.jsdelivr.net/gh/centerclassroom/99u99@main/1.xml"
  },
  {
    "slug": "spider-hero",
    "title": "Spider Hero",
    "category": "skill",
    "rank": 53,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQcoq9-aFbOVqP1_ggQBy6twtKGTE2_D0NXbeib_mn_tiCZzPU3f8TQ1bPMQN4Z9TcZ-cBm3PcyuRPHWOa27zhPEYSyqTZb_a1ul7AD0FOxOkt2e4Hdg407uEewfBmhWVQIhOGlW8gRMbkDZ7q0mVP2UpuCxJkjcDgQl1NW0zrEq-GsNQxW2BxcQz__0OrQHfRLES12xr5O3rCEohaqC2MbuhJGDx1TXSrSUTFSf=w1280",
    "xmlUrl": "https://cdn.jsdelivr.net/gh/classrooms-1/typee@main/2.xml"
  },
  {
    "slug": "sound-effects",
    "title": "Sound Effects",
    "category": "skill",
    "rank": 54,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQeZOmTSHPmPEA7jqjZODUjAFjdxJPFFG3g9cIAZrOcp7SKbMnQUSp2YzskRZJusU1JuQGnAJ0BtIygbzJllWyMheyG3R-NAieN6IJrb1f6ooj-NzY6a7bafiDML71F6y0Y1wlwuy54hc4fl3W2razy3X0k7B1BQtsgDVD3yqFt-O0JtryucUkDZzhpZu4taxPb6lil5kd1ajMJwfyxvjZLu82Sfp0lDga-IfITrWOE=w1280",
    "xmlUrl": "https://cdn.jsdelivr.net/gh/ahert7s777-spec/00tt00@main/1.xml"
  },
  {
    "slug": "cs-2-surf",
    "title": "CS 2 Surf",
    "category": "action",
    "rank": 55,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQfnuHsZA0vDBAGqHV_OHZ8i5NzG1YTnKr1eXyjJrhjawlioHy9vnRF0a34DXOzcidSDDipxaeatRU_qLzl8Wtm4BXz1-mD8Y9Ni-98d1aXeR7qWAvJcZ86fPfpI7ACEkFGXr6caOCxST8fVm_dN1t01THQkQpCQocy-vlkWm4RDMHklwaxHcAaTpzm1GRPtrDcCNbBfbYRWmttoLxB8ilCk1BMFQYw0TJz01lEFje8=w1280",
    "xmlUrl": "https://cdn.jsdelivr.net/gh/777kze777/surf@0131703/3.xml"
  },
  {
    "slug": "drift-ru",
    "title": "Drift Race",
    "category": "driving",
    "rank": 56,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQfNKteC4EZF6Bgm7s7ijWmuylvu79Vr7YTFY6-4tXeYwDpivAPhIOT67iiomfKPrpAkstrbJ-IOjIKNH3EYNgiUdez7mjuIuGZp5vu52zsjtTm94861ezou743qKpa82OX2Gau55MYoxSelalX5sACiaM4qzuWrXkrwkAgsSMiCKpp8vVx5Y7dDDWa_yAfsgCr8U579e16YC8m8mzAWcrVXPvANuY_gOOkVQVOATs8=w1280",
    "xmlUrl": "https://cdn.jsdelivr.net/gh/centerclassroom/mc55@main/rolexx.xml"
  },
  {
    "slug": "bus-simulator",
    "title": "Bus Simulator",
    "category": "skill",
    "rank": 57,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQcaP3N_UDzrls0obHsOLyUNf794JvceAhqwRlEUP9XLKuCD6X6wS02aULnKTdfgkGHvobGceaX4drl8-lYOnz8-fSzTU3_99vxvo1y0IZSB7-Y95UlYLPw1yPy1ppfxFZp0UGYEfPlR7ca0Alx4icwqI0hcv5qdg9qHKI6kclRbX-NZ4pGZXkxtoyy9uaohfmnA5zpmeWlssUcJIrMnmElHhhum4WvCekT9lt8nedg=w1280",
    "xmlUrl": "https://cdn.jsdelivr.net/gh/z799gs/66443488@c9f036d/z/zeplin.xml"
  },
  {
    "slug": "driving-games/asphalt-rush",
    "title": "Asphalt Rush",
    "category": "skill",
    "rank": 58,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQc37wum_KG-uVMyzKR1X0sJcAVrqbDHIQQ2wpyFAoLiOA-x3p4tJq3QOKEMcA06x7EcCAZ79Z6cVBocOgurhzyettfnAhJDl6pVm340PUIvV1odlU1YWzRETcVh6A8cGYAui4Utfrq1kVq9YgCNbNpDiRUJhk12cZH4rq2BEyavz7txvloQ_tDNrlCVODrg7m9YiympK0KK6pRo3i7AFtQ1BQBEb-uE3p2bziZFI2k=w1280",
    "xmlUrl": "https://cdn.jsdelivr.net/gh/bodrumkat/heybex@main/h.xml"
  },
  {
    "slug": "search-for-the-needle",
    "title": "Search Fd Needle",
    "category": "skill",
    "rank": 59,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQedvk6KwLFcjx2I13HJt5n5d5MQrefsyPj2x74qmt-Mxy3rzUNIxd19YpSrAXZR-5qVgAehOyLgnK6aKl7B3SHdsOjT3idKBr1BbC1c01QQvtfpAoz31kKSGkIrsDU4IBhU_V15oKqbI8s3IWyBB1anZaY-aVdzwzK5TYKJy2ZHrFWxBa7nyjjxvHYSO_F51Ao9sToSHJxcOgkHe5IpJfq6iQHTiuy80N9lb71zsA4=w1280",
    "xmlUrl": "https://cdn.jsdelivr.net/gh/tsubasamasa/masabatasabasa@b2e23d3/1.xml"
  },
  {
    "slug": "new-games/tropical-rider-3d",
    "title": "Summer Rider",
    "category": "skill",
    "rank": 60,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQeg2ceEUH2qZO4OqS_fEaYQBPdjmQNOAXtfjSqYO8yjiSiVakBoCKSorTQ8Qxm2kI-Klt_y5vb4nobCjQK8HBrFmNXXR2VM1grXeUSPhewxkiBPsXUjjQnF4TV1cmuMq1oXbGscQeIwPcrU3rrYkQFpbwbJVAPdFNePH5NOpgdpsWK0VXS2pzJvibXXGKu0uO5jh6I49k8RbuEnbOKj9pUUdkB9klGGWf8lpmehO70=w1280",
    "xmlUrl": "https://cdn.jsdelivr.net/gh/papamamia/447755@main/1.xml"
  },
  {
    "slug": "zomblox",
    "title": "Zomblox",
    "category": "skill",
    "rank": 61,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQejcKIhlZ4cahFwMJbZH8tMlk7S3KLhBQX2vGtksvvS1sVbIQHCvSLHKTHkrkYzCs9GDD600YebZHaMfNlfG3K9229u0kpKJvHEdjg269abML7zv65noqCWxexIXDJ9SBMMjhrqNRvmu5dqs-nZvMCECXxRuAqvrj4Z5I2yoWs6tpFWy0pmGBsUfoiqMqVMXDBNVZRqUgiIFrioSIgr79NLy2hm4gYUw_pdPGd2=w1280",
    "xmlUrl": "https://cdn.jsdelivr.net/gh/gru6nny/rojda@83eb81f/9.xml"
  },
  {
    "slug": "forest-survival",
    "title": "Forest Survival",
    "category": "action",
    "rank": 62,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQcJdz0Ue644xzl0NQKGX3B40h0rXMk-nivheS-YTqOMlDdyS8QKsbM-VMwCrFsOBdEkuHpW-dCRYqUnPsUe2-ohX06vBm2q6lITUhIj6caihbjOojE1O9YbGwSwTvWMJrABNkHSsPLVjqsekgYmNSVcXgrhN2brUP2w-g_wLNoiz3jmKjZEJs-VS5jLfQaMLg_gpQSP2YnSjo6_8ZCzforxG2hdh-4vp1e0yCmA0ZM=w1280",
    "xmlUrl": "https://cdn.jsdelivr.net/gh/papamamia/77441122@main/1/1.xml"
  },
  {
    "slug": "shrek-escape-from-the-swamp",
    "title": "Shrek Escape",
    "category": "action",
    "rank": 63,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQfXwo6Wp6XRe5j2_W67_vjEnsjSZFmLPjYVCqxkhf7s5wNlChUvahsg6hpz3sIOojdcUtwt_iBG4eUzuR5-YfDB8n2Z5yQ_ZJHtyrgsmnNBsBmkKtO3-yGDzhXcvYg-6sSFiAcA4PXxcqpxtZsoKmI8MyscuF4njI9LsdJMdVgt_aCEPaT9HQJwEcxZOX1qPjs_s3ZEuDLmXJw_s0B2BEkd_emWUZPNNqkDxTq2=w1280",
    "xmlUrl": "https://cdn.jsdelivr.net/gh/777kze777/shreh@main/1.xml"
  },
  {
    "slug": "tsunami-brainrots",
    "title": "Tsunami Brainrots",
    "category": "skill",
    "rank": 64,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQfnNlsOlucH9e1fyCgL1gZSj3LdECdtWLlOjR_RloiDxt7dVBWKOCGk3TSJ2Koecnlgdwclo-XmJ7BmyzsHOVkREgwdHY8Ai-T_5FvGYaf81GN5uaCUPy_jfjKPO_u6dV6GQhm6mZnghoo5hIFndPwUuPEF7EGas-nCDTM1HCN5IVc6nt_g_2DDvEQeDzVuEJKa0Csw8CU9zjKnIqnSSeF8xin1n6EB09MuZa1r8a0=w1280",
    "xmlUrl": "https://cdn.jsdelivr.net/gh/ftbaldana/hello@main/3.xml"
  },
  {
    "slug": "planet-destroyer",
    "title": "Planet Destroyer",
    "category": "skill",
    "rank": 65,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQcJCue5wv1TWjy6BTKg0eT25IuvNAuc57AU1APvHEKO9FfIkUloG0SdOVX67Ui5bKiXph01CHt2Bh_us9XIDyAozjHQ4VWcjmb3JWiESv2RK3pktAqOhdEyXD4vcW3apq-GlpkxFPUoeHoTAzTR3zJIgFom9VUtBBdtbGBByERIJg3lBseEHo_ox2FhqimGxXZiF_NuFb93sKwf1Vl2iFegIEZujm52HsLAkIC89xI=w1280",
    "xmlUrl": "https://cdn.jsdelivr.net/gh/netclassroom/lawyer@main/gs.xml"
  },
  {
    "slug": "67-clicker",
    "title": "67 Clicker",
    "category": "skill",
    "rank": 66,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQdCpnjtxAuFCzdMwhe78RiILyt7evywcycB1O3ljqNldCRX_0pzvsdrNhS4hHzW7FYyvzRR52YlrNlG9IsBgS6aKfwMylwKwsgPwknokRYdDLXwFxkWokv1GKO--q2pw3YTnelvlSxdXMCOLlcdjhKbrAfoxqNoyYuooAyqobkOfYrnb-_Exlm5AxnrNI5c3pzG4lJR1Fm-LMSfoYueHukhjkypgfEQr6f0fi5aPlI=w1280",
    "xmlUrl": "https://cdn.jsdelivr.net/gh/ftbaldana/he77llo@main/1.xml"
  },
  {
    "slug": "cluster-rush",
    "title": "Cluster Rush",
    "category": "skill",
    "rank": 67,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQdZExqEzWD9mdX_d-afzc0SjNkEXHWxajZepDOI4rRBBYr6DqTtpgiKQJM1L2QzOrMwUm7UXw8vysy1yR2TVM5zVGRALJH7xXRhGdC6GfB9Z5zgAIIjJLtRaRjn7wFsWb96d9ISfqL95JhPkf96Br1WG3OJ2IiEH8S1DlRBiR9bakPuC4N1MVGXpWDKC44Vaf_ZJfEkW5_ZXFflzi0_ljf110sYqdEuYEf4ReAColc=w1280",
    "xmlUrl": "https://cdn.jsdelivr.net/gh/classrooms-1/google.com@main/1.xml"
  },
  {
    "slug": "obby-ambot",
    "title": "Obby Bots",
    "category": "skill",
    "rank": 68,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQf39FDr39g0nh4AspdqGSXGT7csJlwpBK1jOpxKGKpPchVDjk410atGxtuXFdtH7do2qpFDN8XNI-jR4aCnqusGTkBwH7wZeP8w3INcn1K0t6zKyQNRbXmBdmZD6FrVL3BZmhnxGp5S-rCOQAe2h2KJ0QPRtkPn5UQ3dDU5tNq4l6L-9uZbI_kU9aU2QQu6z3lMaHtyHV442exipmHXl57NDnNu-sIt5LdxNQPg=w1280",
    "xmlUrl": "https://cdn.jsdelivr.net/gh/kelsimsk/956785956785@main/2.xml"
  },
  {
    "slug": "keyboard-escape",
    "title": "Keyboard Escape",
    "category": "action",
    "rank": 69,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQdomAJdix4fcZMrIvhYuZmNGR7g-hC-5ah-iFJ7iiSSpkL-Vzf2bym3TLcPLdeWeeR_H9f8eD9yNpVsPVxMxh_Hfj_UvVZ3GmGsqj6tzFovOUZwN4ybGAR3SsFHDIisRYQFOH3hLR0WES_t1caTzia6QJldIX7jzv19t96Z_f2twFsX_RQpfYEZvfdtCoBBAfWCS5y9U6mWgjeIQDcygBEYN8nwsP7UhEw9fPt1s9M=w1280",
    "xmlUrl": "https://cdn.jsdelivr.net/gh/school-management-google/backln@main/m.xml"
  },
  {
    "slug": "papa-louie-2-when-burgers-attack",
    "title": "Papa's Series",
    "category": "skill",
    "rank": 70,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQcCRjzJZoWlsbNEbahRytrXiOCYAWNedFC4kHEydCz4j4zVJ9Kui0yClcX4rELQ1d0BmKYftV4_YZsgn1KsF3awN85A6Y1Pq5D505dufx3Ap2CQ9Ud7e-nRPj2Ydq98jGUp4pR9FobQ8mCMqnk9wvE7dC2gS2pQoV1Yg7c0qMT2P-L3U6-q_nUUhOgZ0oVps8gh0mGvxXvMGG81eKm2YkIJRovx2CoRY7Dwh38HRfo=w1280",
    "xmlUrl": "https://cdn.jsdelivr.net/gh/createzalma6z/seyya774@main/when.xml"
  },
  {
    "slug": "cs",
    "title": "Counter Strike",
    "category": "action",
    "rank": 71,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQfCSjI8mXtuEQ6RQ51ZKbPjiAFsicMahSk4XM8xf0KucB4v9LQr3Q8Fv9jEtxvx08kqxKEmtmCtfZH5C9EV1oZJlvnQmvtE-VH8IV4ODqQow3AxsjcYIrW0vdv_yaahqwAVaDylaAmHGvfuFyMERLn6z8H1j3GiyLyQpfRNo4ba0MAD2rogkUAZxFp7AwP9ZfvU-IPng45dZVNHZyJZJmwzcqqhJep2h80KDHZA=w1280",
    "xmlUrl": "https://cdn.jsdelivr.net/gh/teamschoolcomu/2@1939a791b6a3435778308ddcdc1fa88abb2532f8/1.xml"
  },
  {
    "slug": "half-life",
    "title": "Half-Life",
    "category": "action",
    "rank": 72,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQdHRqPMBH5DzQ5MKyK4LXH-p4sSikecTIgaTDQYr504cjubMhK6bMmjC1gNPV2Chln94WwhnlryUEuV6Q8_rEHF57Ar-Rh4WVZ5KydSaQtYmTrTwTac2LIWBY5ILbwd9Ct9_Yj1hQfCj9ofV1HzZXUzAxgR7UowCg_yw18t0o6ZlAyOmvm-zH3I1X2p5yOAEhir8P0WRgpsg9sz9klNmsf6bymKzXRBbLu4hA=w1280",
    "xmlUrl": "https://cdn.jsdelivr.net/gh/styles-css-files/css@e172557b39c75f3b9257b4ca4c88d50bde3002f9/styles.xml"
  },
  {
    "slug": "new-games/shrek-my-neighbor",
    "title": "Shrek: Neighbor",
    "category": "action",
    "rank": 73,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQeG8PDj-qsoEN2pK1wmApudfM0GbMLOTVwiZLDsAuH0a67HC4kGhIPddKOEPZuSFKEhMmBjU27PiH4hNUrjygF1ZafvHL5SQkC_m1mij14Tfka1sFI2kigA9I93aw_kg2PZ8QsT4ZWmgIgKmu3dOZaTThtlaulE1byKNccMyo_SbNomXP7FUSHvio6gQIh1ZQ3jdG_JuH4oVLMgeOjk0Wb3_ppqQlcFFlXVnybd=w1280",
    "xmlUrl": "https://cdn.jsdelivr.net/gh/ertemr33/heyenarge@1edc641/1.xml"
  },
  {
    "slug": "new-games/the-man",
    "title": "The man!",
    "category": "action",
    "rank": 74,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQfQx0Czz8WFUrz3egPZbl5uyWuO6wAmwn6kjiwqkx_utgcXm0ZyOS2kKLAz3TrHAqNNO6pW-CBp53MuUxykuDsKXANRVJUZfKDG5Qg3X9qupjnAbovxPJRb-UoUjHhNSWGvcqiBjOrqgYuNclWkPbP4A-SZY8KT4FRPQ2-XzYzGcJ_SP3N9xXdPQiycvyO1OLUA3K99Qz2FVAUvGdZNX9ZEcYL_xcOmbLKIXYzY=w1280",
    "xmlUrl": "https://cdn.jsdelivr.net/gh/styles-css-files/00v00v00v500v00v00@606246275a8efb7080ca5e323c43374027293b75/css/1.xml"
  },
  {
    "slug": "abnormal-house",
    "title": "Abnormal House",
    "category": "action",
    "rank": 75,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQedVW9m3pyZPKUOAF-gp2lIqu8Vav1JfiAwqn0ZhnakLEopnhKcKi89S03O99f31Il-y0gbIPADHtzMfbNz8feT-a__PP88q4LGkRSjSCDErXQcHSCtuux6cYiZO4Z9Wa6oPyyVUMMTI5AmCiDmRxQEnWG7x_B1xP8bDRURrrZ8VhnGqwnpq-zxvhbzFayAci3SlAR7kZuEywbUKFr1-sLhmV717osDlKK0jeeAKdg=w1280",
    "xmlUrl": "https://cdn.jsdelivr.net/gh/netclassroom/gfmrt@main/tdm.xml"
  },
  {
    "slug": "taco-stand",
    "title": "Taco Stand",
    "category": "skill",
    "rank": 76,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQdJ6UKsB-nmjJDRrW0wtPLAdU42gfMSSxBNnsVvnIAkAWJa-mS88_4koueoxaXPkFtGQXirqxgCoxJ3fIR_nEv_Wc_knydOy-yf7t1gQm0mdnt4EkN4zaBzNzRLnUHcgzrBcN1Tj-aPqunSBifMR4FjA3PkLtTeCEMAyG42AsQfsyvUBf9G-BrOfYK2Oj_hyy8OaAo9XJ0sjR4-XLe2m2brViVHhYrvLU_Z9fQz=w1280",
    "xmlUrl": "https://cdn.jsdelivr.net/gh/netclassroom/998800@main/n/1.xml"
  },
  {
    "slug": "new-games/delivery",
    "title": "Delivery Mystrey",
    "category": "action",
    "rank": 77,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQfqSIlRs5DCntEa2oh1BWQoe9n6xmgfeIObDccdVy7lfYnHxQ4ro69MQ2ntfEMJbOSN2dMXcgrAF3o7RSq2RJfvMT-EHmmvBhydXIQTB13UliQCGeC5_nK3g3ddrTi4IvIX4dOYOXeYyfWQKny1E4mnrwz89ucvCvaAy7B2FN75BAbSg1s4RSzLXcbS6pZb6fmqzaNnuduKDLuDfdL1_kuFfhN6Nj96YNIrWsSwQHQ=w1280",
    "xmlUrl": "https://cdn.jsdelivr.net/gh/familiapablo/safa@main/1.xml"
  },
  {
    "slug": "new-games/buckshot-roulette",
    "title": "Buckshot Roulett",
    "category": "action",
    "rank": 78,
    "rawImgUrl": "https://sites.google.com/sitesv-images-rt/APXyLQf9K8pyw8K0FRQvxEi7eWKVrB5p9Wei7JwTMr3ko_1OfnOUWH2gbHEh0OqN4LUa_9QsMrUsVTWwSEClmJhmAaKIzobpmULcIspvAW8Y6feggIUHYTa8BhjH-uYEgwCEpDXhVl1fr7GNEhS7RHdpDOpJGR2Yrm65Hz1LM48m7KEsI7j-GhLkChPFshGhm1oIJcdJ7hHJ1rtixx_n1vw75WXLVcP5E0ifrLLjjRBq=w1280",
    "xmlUrl": "https://cdn.jsdelivr.net/gh/schoolflashx/t7575@main/1.xml"
  }
];

export function findStaticU7XmlUrl(slug: string): string | null {
  const hit = U7_STATIC_CATALOG.find((item) => item.slug === slug);
  return hit && hit.xmlUrl ? hit.xmlUrl : null;
}
