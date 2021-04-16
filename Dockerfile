FROM fpco/stack-build-small:lts-17.8
RUN apt-get update && \
    apt-get install -y libhdf5-dev libbz2-dev pkg-config npm && \
    rm -rf /var/lib/apt/lists/*
RUN echo /opt/ghc/*/lib/ghc-*/rts > /etc/ld.so.conf.d/ghc.conf && \
    ldconfig
RUN useradd -u 999 -m flathub
USER flathub

COPY --chown=flathub stack.yaml *.cabal Setup.hs COPYING /home/flathub/flathub/
WORKDIR /home/flathub/flathub
RUN stack build --dependencies-only --extra-include-dirs=/usr/include/hdf5/serial --extra-lib-dirs=/usr/lib/x86_64-linux-gnu/hdf5/serial
COPY --chown=flathub src ./src
RUN stack install && rm -rf .stack-work
COPY --chown=flathub web ./web
RUN make -C web
COPY --chown=flathub html ./html
COPY --chown=flathub config ./config
COPY --chown=flathub catalogs ./catalogs

EXPOSE 8092
ENTRYPOINT ["/home/flathub/.local/bin/flathub"]
CMD []
ENV LD_LIBRARY_PATH=/home/stackage/.stack/programs/x86_64-linux/ghc-8.8.4/lib/ghc-8.8.4/rts
